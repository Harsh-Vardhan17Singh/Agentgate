
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const mongoUri = process.env.MONGODB_URI;
  const sessionSecret = process.env.REVIEWER_SESSION_SECRET;
  const frontendOrigin =
    process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      'REVIEWER_SESSION_SECRET must be configured with a strong secret.',
    );
  }

  if (isProduction && !process.env.FRONTEND_ORIGIN) {
    throw new Error('FRONTEND_ORIGIN must be configured in production.');
  }

  if (isProduction) {
    // Render terminates HTTPS at its proxy.
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });


  // Protect browser-session requests against cross-origin state changes.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(
      req.method.toUpperCase(),
    );

    const origin = req.headers.origin;
    const hasReviewerSessionCookie = req.headers.cookie
      ?.split(';')
      .some((cookie) => cookie.trim().startsWith('agentgate.sid='));

    const invalidOrigin = origin !== undefined && origin !== frontendOrigin;
    const missingOriginWithSession =
      Boolean(hasReviewerSessionCookie) && origin === undefined;

    if (
      unsafeMethod &&
      (invalidOrigin || missingOriginWithSession)
    ) {
      res.status(403).json({
        statusCode: 403,
        message: 'Origin not allowed.',
      });
      return;
    }

    next();
  });

  app.use(
    session({
      name: 'agentgate.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'reviewer_sessions',
        ttl: 60 * 60 * 8,
        autoRemove: 'native',
      }),
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 8,
        path: '/',
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
