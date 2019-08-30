import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Logger } from './logger';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

  private _logger: Logger;

  constructor() {
    this._logger = new Logger();
  }

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const now = Date.now();
    const url = request.url;
    const method = request.method;
    const controllerName = context.getClass().name;

    return next
      .handle()
      .pipe(
        tap(() => {
          const elapsedTime = Date.now() - now;
          this._logger.handleHttpRequest({
            elapsedTime,
            url,
            method,
            context: controllerName,
            statusCode: response.statusCode
          });
        })
      );
  }
}
