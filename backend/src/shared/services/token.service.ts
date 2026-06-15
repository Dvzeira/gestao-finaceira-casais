import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

// Gera tokens de uso único (e-mail/reset/refresh/convites) enviados ao
// usuário em texto puro; tokens sensíveis são persistidos apenas como hash
// SHA-256 — evita que o vazamento do banco permita reutilizá-los.
@Injectable()
export class TokenService {
  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
