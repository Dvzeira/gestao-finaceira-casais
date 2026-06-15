import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Módulo global: PrismaService fica disponível para qualquer módulo
// sem precisar importar PrismaModule repetidamente.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
