export const RMQ_CONNECT_OPTIONS = 'RMQ_CONNECT_OPTIONS';
export const RMQ_BROKER_OPTIONS = 'RMQ_BROKER_OPTIONS';
export const RMQ_MESSAGE_META_TEG = 'RMQ_MESSAGE_META_TEG';
export const RMQ_ROUTES_TRANSFORM = 'RMQ_ROUTES_TRANSFORM';
export const RMQ_APP_OPTIONS = 'RMQ_APP_OPTIONS';
export const TARGET_MODULE = 'TARGET_MODULE';
export const SER_DAS_KEY = 'SER_DAS_KEY';
export const INTERCEPTOR_KEY = 'INTERCEPTOR_KEY';
export const SERDES = 'SERDES';
export const INTERCEPTORS = 'INTERCEPTORS';
export const MESSAGE_ROUTER = 'MessageRouterExplorer';
export const MODULE_TOKEN = 'MODULE_UNIQ_TOKEN';

export const CLOSE_EVENT = 'close';
export const CONNECT_ERROR = 'error';
export const CONNECT_BLOCKED = 'blocked';
export const INITIALIZATION_STEP_DELAY = 400;
export const DEFAULT_TIMEOUT = 40000;
export const RECONNECTION_INTERVAL = 5000;
export const NON_ROUTE = 'non_route_one';
export const INDICATE_REPLY_QUEUE = 'Please indicate `replyToQueue`';
export const INDICATE_REPLY_QUEUE_GLOBAL =
  'Please indicate `replyToQueue` in globalBroker';
export const TIMEOUT_ERROR = 'Response timeout error';
export const RECIVED_MESSAGE_ERROR = 'Received a message but with an error';
export const ERROR_RMQ_SERVICE = 'Rmq service error';
export const NACKED = 'Negative acknowledgment';
export const RETURN_NOTHING = 'Route return noting';
export const INOF_NOT_FULL_OPTIONS =
  'Queue will not be created if there is no bind';
export const ERROR_NO_ROUTE =
  "Requested service doesn't have MessageRoute with this path";
export const EMPTY_MESSAGE = 'Received empty message content';
export const MESSAGE_NON = 'Send an existing message';
export const CLOSE_MESSAGE = 'Disconnected from RMQ. Trying to reconnect';
export const CONNECT_FAILED_MESSAGE = 'Failed to connect to RMQ';
export const WRONG_CREDENTIALS_MESSAGE = 'Wrong credentials for RMQ';
export const CONNECT_BLOCKED_MESSAGE = 'Connection blocked';
export const SUCCESSFULL_CONNECT = 'Successfully connected to RabbitMQ';
