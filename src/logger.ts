import chalk from 'chalk';
import * as util from 'util';
import * as Moment from 'moment';
import { Injectable, LoggerService } from '@nestjs/common';

/**
 * Severity of log
 */
export enum eLogSeverity {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

export interface ILogger extends LoggerService {

  setLogLevel(level: eLogSeverity): void;
  setProductionMode(productionMode: boolean): void;

  log(message: any): any;
  info(message: any): any;
  warn(message: any): any;
  error(message: any): any;
  handleError(e: Error, context: any): any;
}

@Injectable()
export class Logger implements ILogger {

  private static _instance: Logger;

  private _logLevel: eLogSeverity;
  private _productionMode: boolean;
  private readonly _instanceContext: any;
  private readonly _severityMapping: { [severity: number]: { text: string, printFn: any } } = {
    [eLogSeverity.DEBUG]: { text: 'DEBUG', printFn: chalk.bgGreen.bold },
    [eLogSeverity.INFO]: { text: 'INFO', printFn: chalk.bgBlue.bold },
    [eLogSeverity.WARN]: { text: 'WARN', printFn: chalk.bgYellow.bold },
    [eLogSeverity.ERROR]: { text: 'ERROR', printFn: chalk.bgRed.bold }
  };

  constructor(context?: string | any, logLevel?: eLogSeverity) {
    if (!context) {
      context = {};
    } else if (typeof context === 'string') {
      context = { context };
    }
    this._logLevel = logLevel;
    this._instanceContext = context;
    this._productionMode = process.env.NODE_ENV === 'production';

    if (!Logger._instance) {
      Logger._instance = this;
    }
  }

  /**
   * Set static instance of the logger
   * @param instance
   */
  public static setStaticInstance(instance: Logger) {
    Logger._instance = instance;
  }

  /**
   * Set log level
   * @param level
   */
  public setLogLevel(level: eLogSeverity): void {
    this._logLevel = level;
  }

  /**
   * Set log level
   * @param level
   */
  public static setLogLevel(level: eLogSeverity) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.setLogLevel(level);
  }

  /**
   * Set production mode
   * @param productionMode
   */
  public setProductionMode(productionMode: boolean): void {
    this._productionMode = productionMode;
  }

  /**
   * Set production mode
   * @param productionMode
   */
  public static setProductionMode(productionMode: boolean) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.setProductionMode(productionMode);
  }

  /**
   * Log a message
   * @param message Message to log (could be string or object)
   */
  public log(message: any): any {
    this._logMessage(message, eLogSeverity.INFO);
  }

  /**
   * Log a message
   * @param message Message to log (could be string or object)
   */
  public static log(message: any) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.log(message);
  }

  /**
   * Log a message on info level
   * @param message Message to log (could be string or object)
   */
  public info(message: any): any {
    this._logMessage(message, eLogSeverity.INFO);
  }

  /**
   * Log a message on info level
   * @param message Message to log (could be string or object)
   */
  public static info(message: any) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.info(message);
  }

  /**
   * Log a message on warn level
   * @param message Message to log (could be string or object)
   */
  public warn(message: any): any {
    this._logMessage(message, eLogSeverity.WARN);
  }

  /**
   * Log a message on warn level
   * @param message Message to log (could be string or object)
   */
  public static warn(message: any) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.warn(message);
  }

  /**
   * Log a message on error level
   * @param message Message to log (could be string or object)
   */
  public error(message: any): any {
    if (message instanceof Error) {
      return this.handleError(message);
    }
    this._logMessage(message, eLogSeverity.ERROR);
  }

  /**
   * Log a message on error level
   * @param message Message to log (could be string or object)
   */
  public static error(message: any) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.warn(message);
  }

  /**
   * Log an http request
   * @param requestData Http request data
   */
  public handleHttpRequest(requestData: { elapsedTime: number, url: string, method: string, statusCode: number, context: string }) {
    if (this._productionMode) {
      return this.info(requestData);
    }

    const methodStr = chalk.bold(requestData.method);
    const urlStr = chalk.yellowBright.bold(requestData.url);
    const statusCode = Logger._buildStatusCodeStr(requestData.statusCode);

    const message = `${methodStr} ${urlStr} => ${statusCode} (${requestData.elapsedTime} ms)`;
    this.info({
      context: requestData.context,
      message
    });
  }

  /**
   * Log an error
   * @param e
   * @param context
   */
  public handleError(e: Error, context: any = {}): any {
    this.error({
      ...context,
      message: e.message,
      stack: e.stack
    });
  }

  /**
   * Log an error
   * @param e
   * @param context
   */
  public static handleError(e: Error, context: any = {}) {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    Logger._instance.handleError(e, context);
  }

  private _logMessage(message: any, severity: eLogSeverity) {
    if (this._logLevel > severity) {
      return;
    }
    const payload = this._buildMessagePayload(message, severity);
    this._printMessage(payload, severity);
  }

  private _buildMessagePayload(message: any, severity: eLogSeverity): any {
    if (typeof message === 'string') {
      message = { message };
    }

    return {
      ...this._instanceContext,
      ...message,
      date: Moment().format('YYYY-MM-DD HH:mm:ss'),
      severity: this._severityMapping[severity].text
    };
  }

  private static _buildStatusCodeStr(statusCode: number): string {
    if (statusCode < 300) {
      return chalk.green.bold(statusCode.toString());
    }
    if (statusCode < 500) {
      return chalk.yellowBright.bold(statusCode.toString());
    }

    return chalk.red.bold(statusCode.toString());
  }

  private _printMessage(payload: any, severity: eLogSeverity) {
    // tslint:disable-next-line:no-console
    const logFn: (message: string) => void = severity === eLogSeverity.ERROR ? console.error : console.log;

    if (this._productionMode) {
      logFn(JSON.stringify(payload));
      return;
    }

    const dtmStr = chalk.bold(`[${payload.date}]`);
    const severityStr = this._severityMapping[severity].printFn(`[${this._severityMapping[severity].text}]`);
    const contextStr = payload.context ? chalk.bold(`[${payload.context}]`) : '';
    const message = payload.message;
    const stack = payload.stack;

    delete payload.date;
    delete payload.severity;
    delete payload.context;
    delete payload.message;
    delete payload.stack;
    const payloadStr = Object.keys(payload).length > 0 ? chalk.yellow.italic(util.inspect(payload)) : '';

    logFn(`${dtmStr}${severityStr}${contextStr} ${message} ${payloadStr}`);
    if (stack) {
      logFn(stack);
    }
  }
}
