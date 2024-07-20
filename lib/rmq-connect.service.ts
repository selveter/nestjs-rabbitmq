import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  CLOSE_EVENT,
  CLOSE_MESSAGE,
  CONNECT_BLOCKED,
  CONNECT_BLOCKED_MESSAGE,
  CONNECT_ERROR,
  CONNECT_FAILED_MESSAGE,
  INITIALIZATION_STEP_DELAY,
  RECONNECTION_INTERVAL,
  RMQ_APP_OPTIONS,
  RMQ_CONNECT_OPTIONS,
  ROOT_MODULE_DECLARED,
  SUCCESSFUL_CONNECT,
} from './constants';
import {
  IRabbitMQConfig,
  IExchange,
  IQueue,
  TypeQueue,
  IBindQueue,
  ISendMessage,
  ISendToReplyQueueOptions,
  IGlobalOptions,
  TypeChannel,
} from './interfaces';
import {
  Channel,
  ConfirmChannel,
  Connection,
  ConsumeMessage,
  Options,
  Replies,
  connect,
} from 'amqplib';
import { RQMColorLogger } from './common/logger';

@Injectable()
export class RmqNestjsConnectService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection = null;
  private baseChannel: Channel | ConfirmChannel = null;
  private replyToChannel: Channel = null;
  public isConnected = false;
  private logger: LoggerService;
  private isInitialized = false;
  constructor(
    @Inject(RMQ_CONNECT_OPTIONS) private readonly options: IRabbitMQConfig,
    @Inject(RMQ_APP_OPTIONS) private globalOptions: IGlobalOptions,
  ) {
    this.logger = globalOptions.appOptions?.logger
      ? globalOptions.appOptions?.logger
      : new RQMColorLogger(this.globalOptions.appOptions?.logMessages);
  }
  async onModuleInit(): Promise<void> {
    if (this.isInitialized) throw Error(ROOT_MODULE_DECLARED);
    await this.setUpConnect(this.options);
    await this.createChannels();

    this.isInitialized = true;
  }

  async assertExchange(options: IExchange): Promise<Replies.AssertExchange> {
    try {
      await this.initializationCheck();
      const exchange = await this.baseChannel.assertExchange(
        options.exchange,
        options.type,
        options.options,
      );
      return exchange;
    } catch (error) {
      throw new Error(
        `Failed to assert exchange '${options.exchange}': ${error.message}`,
      );
    }
  }
  ack(...params: Parameters<Channel['ack']>): ReturnType<Channel['ack']> {
    return this.baseChannel.ack(...params);
  }
  nack(...params: Parameters<Channel['nack']>): ReturnType<Channel['nack']> {
    return this.baseChannel.nack(...params);
  }
  async assertQueue(
    typeQueue: TypeQueue,
    options?: IQueue,
  ): Promise<Replies.AssertQueue> {
    await this.initializationCheck();
    try {
      if (typeQueue == TypeQueue.QUEUE)
        return await this.baseChannel.assertQueue(
          options.queue,
          options.options,
        );

      return await this.replyToChannel.assertQueue(
        options.queue,
        options.options,
      );
    } catch (error) {
      throw new Error(`Failed to assert ${typeQueue} queue: ${error}`);
    }
  }
  async getBaseChannel() {
    await this.initializationCheck();
    return this.baseChannel;
  }
  async bindQueue(bindQueue: IBindQueue): Promise<void> {
    await this.initializationCheck();
    try {
      await this.baseChannel.bindQueue(
        bindQueue.queue,
        bindQueue.source,
        bindQueue.pattern,
        bindQueue.args,
      );
    } catch (error) {
      throw new Error(
        `Failed to Bind Queue ,source:${bindQueue.source} queue: ${bindQueue.queue}`,
      );
    }
  }
  async sendToReplyQueue(sendToQueueOptions: ISendToReplyQueueOptions) {
    try {
      await this.initializationCheck();
      this.replyToChannel.sendToQueue(
        sendToQueueOptions.replyTo,
        sendToQueueOptions.content,
        {
          correlationId: sendToQueueOptions.correlationId,
        },
      );
    } catch (error) {
      throw new Error(`Failed to send Reply Queue`);
    }
  }
  async listenReplyQueue(
    queue: string,
    listenQueue: (msg: ConsumeMessage | null) => void,
    consumOptions?: Options.Consume,
  ) {
    try {
      await this.replyToChannel.consume(
        queue,
        listenQueue,
        consumOptions || {
          noAck: true,
        },
      );
    } catch (error) {
      throw new Error(`Failed to send listen Reply Queue`);
    }
  }
  async listenQueue(
    queue: string,
    listenQueue: (msg: ConsumeMessage | null) => void,
    consumOptions?: Options.Consume,
  ): Promise<void> {
    try {
      await this.baseChannel.consume(
        queue,
        listenQueue,
        consumOptions || {
          noAck: false,
        },
      );
    } catch (error) {
      throw new Error(`Failed to listen Queue`);
    }
  }

  async publish(
    sendMessage: ISendMessage,
    confirmationFunction?: (err: any, ok: Replies.Empty) => void,
  ): Promise<void> {
    try {
      await this.initializationCheck();
      this.baseChannel.publish(
        sendMessage.exchange,
        sendMessage.routingKey,
        sendMessage.content,
        {
          replyTo: sendMessage.options.replyTo,
          correlationId: sendMessage.options.correlationId,
        },
        confirmationFunction,
      );
    } catch (error) {
      throw new Error(`Failed to send message ${error}`);
    }
  }

  private async setUpConnect(options: IRabbitMQConfig): Promise<void> {
    try {
      this.connection = await connect(
        options,
        this.globalOptions.socketOptions,
      );
      this.isConnected = true;
      this.logger.log(SUCCESSFUL_CONNECT);

      this.connection.on(CLOSE_EVENT, (err) => {
        this.isConnected = false;
        this.logger.error(`${CLOSE_MESSAGE}: ${err.message}`);
        this.reconnect(options);
      });

      this.connection.on(CONNECT_ERROR, (err) => {
        this.logger.error(`${CONNECT_FAILED_MESSAGE}: ${err.message}`);
      });
      this.connection.on(CONNECT_BLOCKED, (err) => {
        this.logger.error(`${CONNECT_BLOCKED_MESSAGE}: ${err.message}`);
      });
    } catch (err) {
      this.logger.error(`Failed to connect: ${err.message}`);
    }
  }

  private async reconnect(options: IRabbitMQConfig): Promise<void> {
    this.logger.log('Attempting to reconnect...');
    setTimeout(async () => {
      try {
        await this.setUpConnect(options);
      } catch (err) {
        this.logger.error(`Reconnection failed: ${err.message}`);
        this.reconnect(options);
      }
    }, RECONNECTION_INTERVAL);
  }
  private async createChannels() {
    try {
      this.baseChannel =
        this.globalOptions?.typeChannel == TypeChannel.CONFIRM_CHANNEL
          ? await this.createConfirmChannel()
          : await this.createChannel();

      this.replyToChannel = await this.createChannel();
    } catch (error) {
      throw error;
    }
  }

  sendToQueue(
    queue: string,
    content: Buffer,
    options?: Options.Publish,
  ): boolean {
    try {
      return this.baseChannel.sendToQueue(queue, content, options);
    } catch (error) {
      throw new Error(`Failed to send message ${error}`);
    }
  }
  private async initializationCheck() {
    if (this.isInitialized) return;
    await new Promise<void>((resolve) =>
      setTimeout(resolve, INITIALIZATION_STEP_DELAY),
    );
    await this.initializationCheck();
  }
  private async createChannel() {
    return await this.connection.createChannel();
  }
  private async createConfirmChannel() {
    return await this.connection.createConfirmChannel();
  }
  async onModuleDestroy(): Promise<void> {
    await this.baseChannel.close();
    await this.replyToChannel.close();
    await this.connection.close();
  }
}
