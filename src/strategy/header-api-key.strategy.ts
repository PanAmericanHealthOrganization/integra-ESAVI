import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Strategy from 'passport-headerapikey';

@Injectable()
export class HeaderApiKeyStrategy extends PassportStrategy(
  Strategy,
  'api-key',
) {
  constructor(private readonly configService: ConfigService) {
    super({ header: 'X-API-KEY', prefix: '' }, true, async (apiKey, done) => {
      return this.validateApiKey(apiKey, done);
    });
  }
  public validateApiKey = (
    apiKey: string,
    done: (error: Error, data) => {},
  ) => {
    if (this.configService.get<string>('API_KEY') === apiKey) {
      done(null, true);
    } else {
      console.log(UnauthorizedException, apiKey);
      done(new UnauthorizedException(), null);
    }
  };
}
