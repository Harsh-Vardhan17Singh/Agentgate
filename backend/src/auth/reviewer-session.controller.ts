
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import 'express-session';
import type { Request, Response } from 'express';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { ReviewerSessionService } from './reviewer-session.service.js';

class ReviewerLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  key!: string;
}

type ReviewerSessionData = Request['session'] & {
  reviewerAuthenticated?: boolean;
};

@Controller('reviewer')
export class ReviewerSessionController {
  constructor(
    private readonly reviewerSessionService: ReviewerSessionService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: ReviewerLoginDto,
    @Req() request: Request,
  ) {
    if (!this.reviewerSessionService.validateReviewerKey(body.key)) {
      throw new UnauthorizedException('Invalid reviewer credentials.');
    }
    // Regenerate the session after authentication to prevent session fixation.
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error) => {
        if (error) {
          reject(
            new InternalServerErrorException(
              'Could not establish reviewer session.',
            ),
          );
          return;
        }

        resolve();
      });
    });

    (request.session as ReviewerSessionData).reviewerAuthenticated = true;

    // Save before responding so the browser can immediately use the session.
    await new Promise<void>((resolve, reject) => {
      request.session.save((error) => {
        if (error) {
          reject(
            new InternalServerErrorException(
              'Could not save reviewer session.',
            ),
          );
          return;
        }

        resolve();
      });
    });

    return { authenticated: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) {
          reject(
            new InternalServerErrorException(
              'Could not end reviewer session.',
            ),
          );
          return;
        }

        resolve();
      });
    });


response.clearCookie('agentgate.sid', {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});


    return { authenticated: false };
  }

  @Get('session')
  getSession(@Req() request: Request) {
    const session = request.session as ReviewerSessionData;

    return {
      authenticated: session.reviewerAuthenticated === true,
    };
  }
}
