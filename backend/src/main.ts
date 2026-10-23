
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const mongoUri = process.env.MONGODB_URI;
  const sessionSecret = process.env.REVIEWER_SESSION_SECRET;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      'REVIEWER_SESSION_SECRET must be configured with a strong secret.',
    );
  }

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: ['Content-Type'],
  });

  // Session middleware must run before NestJS controllers.
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
