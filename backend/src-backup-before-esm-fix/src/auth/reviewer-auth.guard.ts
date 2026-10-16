
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class ReviewerAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey =
      this.configService.get<string>('REVIEWER_API_KEY');

    if (!expectedKey) {
      throw new InternalServerErrorException(
        'Reviewer authentication is not configured.',
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<Request>();

    const suppliedKey = request.header('x-reviewer-key');

    if (
      !suppliedKey ||
      suppliedKey.length !== expectedKey.length ||
      !timingSafeEqual(
        Buffer.from(suppliedKey),
        Buffer.from(expectedKey),
      )
    ) {
      throw new UnauthorizedException(
        'Invalid or missing reviewer credentials.',
      );
    }

    return true;
  }
}