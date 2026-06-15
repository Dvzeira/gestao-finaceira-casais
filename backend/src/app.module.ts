import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infra/prisma/prisma.module';
import { MailModule } from './infra/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { CouplesModule } from './modules/couples/couples.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { ExpenseCategoriesModule } from './modules/expense-categories/expense-categories.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { RecurringExpensesModule } from './modules/recurring-expenses/recurring-expenses.module';
import { GoalsModule } from './modules/goals/goals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    CouplesModule,
    IncomesModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    RecurringExpensesModule,
    GoalsModule,
    NotificationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
