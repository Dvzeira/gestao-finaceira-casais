import { Module } from '@nestjs/common';
import { USERS_REPOSITORY } from './interfaces/users-repository.interface';
import { UsersRepository } from './repositories/users.repository';

@Module({
  providers: [
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
