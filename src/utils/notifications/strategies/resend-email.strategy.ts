import { Resend } from 'resend';
import {
  NotificationStrategy,
  NotificationPayload,
  NotificationResult,
} from '../interfaces/strategy.interface';
import { logger } from '../../logger';

export class ResendEmailStrategy implements NotificationStrategy {
  readonly provider = 'EMAIL' as const;
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_resend')) {
      this.resend = new Resend(apiKey);
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.resend) {
      logger.warn(
        { to: payload.to, subject: payload.subject },
        'RESEND_API_KEY no configurado en .env; notificación de email simulada exitosamente en logs'
      );
      return {
        success: true,
        provider: this.provider,
        messageId: 'simulated_dev_id',
      };
    }

    try {
      const fromEmail =
        process.env.EMAIL_FROM || 'Vyrtium <onboarding@resend.dev>';

      const response = await this.resend.emails.send({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject || 'Notificacion Vyrtium',
        html: payload.html || '',
        text: payload.text,
      });

      if (response.error) {
        logger.error(
          { err: response.error, to: payload.to },
          'Fallo al enviar correo mediante Resend'
        );
        return {
          success: false,
          provider: this.provider,
          error: response.error.message,
        };
      }

      logger.info(
        { messageId: response.data?.id, to: payload.to },
        'Correo electronico enviado exitosamente via Resend'
      );

      return {
        success: true,
        provider: this.provider,
        messageId: response.data?.id,
      };
    } catch (err: any) {
      logger.error(
        { err: err.message, to: payload.to },
        'Excepcion no controlada enviando correo via Resend'
      );
      return {
        success: false,
        provider: this.provider,
        error: err.message,
      };
    }
  }
}
