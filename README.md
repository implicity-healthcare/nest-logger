# Nest Logger

Implicity flavored logger for Nest.js service

## Install

```bash
npm install --save @implicity/nest-logger
```

## Usage

Nest.js logger: *main.ts*
```typescript
import { Logger } from '@implicity/nest-logger';

const serviceLogger = new Logger();
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: serviceLogger
  });

  await app.listen(process.env.SERVICE_PORT);
}

bootstrap()
  .catch((e) => {
    serviceLogger.handleError(e);
    process.exit(1);
  });
```

Route logger: *app.module.ts*
```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '@implicity/nest-logger';


@Module({
  imports: [],
  controllers: [],
  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor  }]
})
export class AppModule {}
```

Using the static instance:
```typescript
import { Logger } from '@implicity/nest-logger';

Logger.info('This is a log message');
Logger.info({
    message: 'This is a log message with meta !',
    meta: 'toto',
    context: 'MyController'
});
```

Instancing a logger instance:
```typescript
import { Logger } from '@implicity/nest-logger';

const myLoggerWithMeta = new Logger({
    myMeta: 'lol'
});
myLoggerWithMeta.info('This is a log message');
myLoggerWithMeta.info({
    message: 'This is a log message with meta !',
    meta: 'toto',
    context: 'MyController'
});
```
