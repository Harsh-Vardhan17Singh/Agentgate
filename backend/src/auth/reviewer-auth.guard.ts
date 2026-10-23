
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

type ReviewerSessionData = Request['session'] & {
  reviewerAuthenticated?: boolean;
};

@Injectable()
export class ReviewerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>();

    const session = request.session as ReviewerSessionData | undefined;

    if (session?.reviewerAuthenticated !== true) {
      throw new UnauthorizedException(
        'Reviewer login required.',
      );
    }

    return true;
  }
}
