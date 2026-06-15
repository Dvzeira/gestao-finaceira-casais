import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

// Encapsula o hashing/verificação de senhas com bcrypt, isolando o algoritmo
// usado pelo AuthService.
@Injectable()
export class PasswordService {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, SALT_ROUNDS);
  }

  async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return compare(plainPassword, passwordHash);
  }
}
