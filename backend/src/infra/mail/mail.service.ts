import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Encapsula o envio de e-mails transacionais (confirmação de conta, reset de
// senha) via SMTP usando nodemailer, configurado a partir das variáveis MAIL_*.
@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'no-reply@example.com');

    this.transporter = createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: this.config.get<number>('MAIL_PORT', 587) === 465,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  private async sendEmail(options: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Redefinição de senha',
      html: `
        <p>Olá!</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para continuar:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Se você não solicitou isso, ignore este e-mail. Sua senha permanecerá inalterada.</p>
      `,
    });
  }

  async sendCoupleInvite(
    to: string,
    inviterName: string,
    inviteUrl: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${inviterName} convidou você para gerenciar as finanças do casal`,
      html: `
        <p>Olá!</p>
        <p><strong>${inviterName}</strong> convidou você para gerenciar as finanças do casal na
        Gestão Financeira para Casais.</p>
        <p>Clique no link abaixo para aceitar o convite:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>Se você não esperava este convite, ignore este e-mail.</p>
      `,
    });
  }
}
