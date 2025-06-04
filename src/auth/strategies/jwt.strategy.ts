import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'Zr8qPf27XmL9AyVoKjN0REcTsdgW1uICBxvYQHpMnBkTJh5SwF4a6UZyXGE3LtvnaoCMk92DJw7pqsVxrYzA1gQKLnT3WeRUf',
      issuer: configService.get<string>('JWT_ISSUER') || 'dsicode-auth-api',
      audience: configService.get<string>('JWT_AUDIENCE') || 'dsicode-client',
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}