import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const appName = process.env.APP_NAME || 'MULTI SAN JUAN';

    await this.transporter.sendMail({
      from: `"${appName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Código de recuperación - ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Recuperación de contraseña</h2>
          <p>Has solicitado restablecer tu contraseña en <strong>${appName}</strong>.</p>
          <p style="font-size: 14px; color: #64748b;">Usa el siguiente código para verificar tu identidad:</p>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Este código expirará en 15 minutos. Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      `,
    });

    this.logger.log(`Password reset code sent to ${email}`);
  }
}
