
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class ReviewerSessionService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  validateReviewerKey(suppliedKey: string): boolean {
    const expectedKey =
      this.configService.get<string>('REVIEWER_API_KEY');

    if (!expectedKey) {
      throw new InternalServerErrorException(
        'Reviewer authentication is not configured.',
      );
    }

    const suppliedBuffer = Buffer.from(suppliedKey);
    const expectedBuffer = Buffer.from(expectedKey);

    if (suppliedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(suppliedBuffer, expectedBuffer);
  }
}
