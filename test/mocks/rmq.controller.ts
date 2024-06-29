import { Injectable } from '@nestjs/common';
import { MessageRoute, RmqService, RmqGlobalService } from '../../lib';

@Injectable()
export class RmqServieController {
  constructor(
    private readonly rmqServie: RmqService,
    private readonly rmqGlobalService: RmqGlobalService,
  ) {}

  async sendMessage(obj: any, topic: string = 'text.text') {
    const sendhi = await this.rmqServie.send<object, { message: object }>(
      topic,
      obj,
    );
    return sendhi;
  }

  async sendNonRoute(obj: any) {
    const message = await this.rmqServie.send<object, { message: object }>(
      'text.text.text',
      obj,
    );
    return message;
  }
  async sendGlobalRoute(obj: any) {
    const message = await this.rmqGlobalService.send<
      object,
      { message: object }
    >('for-test', 'rpc.global', obj);
    return message;
  }
  @MessageRoute('rpc.global')
  recivedTopicPattern(obj: any) {
    return { message: obj };
  }
}
