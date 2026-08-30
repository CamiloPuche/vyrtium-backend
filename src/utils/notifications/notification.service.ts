import {
  NotificationProvider,
  NotificationStrategy,
  NotificationResult,
} from './interfaces/strategy.interface';
import { NOTIFICATION_TEMPLATES } from './templates';
import { replaceTemplateVariables } from './notification.utils';
import { ResendEmailStrategy } from './strategies/resend-email.strategy';
import { logger } from '../logger';

export interface SendNotificationOptions {
  templateName: string;
  subcase: string;
  email?: string;
  phone?: string;
  variables?: Record<string, string | number>;
  providers?: NotificationProvider[];
}

export class NotificationService {
  private strategies: Map<NotificationProvider, NotificationStrategy> = new Map();

  constructor() {
    // Register default strategies
    this.registerStrategy(new ResendEmailStrategy());
  }

  registerStrategy(strategy: NotificationStrategy): void {
    this.strategies.set(strategy.provider, strategy);
  }

  async send(
    options: SendNotificationOptions
  ): Promise<Record<NotificationProvider, NotificationResult>> {
    const {
      templateName,
      subcase,
      email,
      variables = {},
      providers = ['EMAIL'],
    } = options;

    const caseTemplates = NOTIFICATION_TEMPLATES[templateName];
    if (!caseTemplates) {
      logger.error({ templateName }, `Caso de notificación '${templateName}' no existe.`);
      return {} as Record<NotificationProvider, NotificationResult>;
    }

    const subcaseTemplate = caseTemplates[subcase];
    if (!subcaseTemplate) {
      logger.error(
        { templateName, subcase },
        `Subcaso '${subcase}' no existe en '${templateName}'.`
      );
      return {} as Record<NotificationProvider, NotificationResult>;
    }

    const results: Partial<Record<NotificationProvider, NotificationResult>> = {};

    for (const provider of providers) {
      const strategy = this.strategies.get(provider);
      if (!strategy) {
        logger.warn(
          { provider },
          `No se encontró estrategia registrada para el proveedor: ${provider}`
        );
        results[provider] = {
          success: false,
          provider,
          error: `Estrategia no implementada para el proveedor: ${provider}`,
        };
        continue;
      }

      // 1. Canal EMAIL
      if (provider === 'EMAIL' && email && subcaseTemplate.EMAIL) {
        try {
          const emailConfig = subcaseTemplate.EMAIL;

          // Mapeo e interpolación de variables declaradas en data
          const mappedData: Record<string, string> = {};
          Object.entries(emailConfig.data || {}).forEach(([key, templateVar]) => {
            mappedData[key] = replaceTemplateVariables(templateVar, variables);
          });

          // Interpolar asunto con los datos mapeados
          const renderedSubject = replaceTemplateVariables(emailConfig.subject, mappedData);

          // Renderizar plantilla HTML y texto
          const rendered = emailConfig.template(mappedData);
          const renderedHtml = typeof rendered === 'string' ? rendered : rendered.html;
          const renderedText = typeof rendered === 'string' ? undefined : rendered.text;

          // Despachar mediante la estrategia activa
          const result = await strategy.send({
            to: email,
            subject: renderedSubject,
            html: renderedHtml,
            text: renderedText,
            variables: mappedData,
          });
          results.EMAIL = result;
        } catch (err: any) {
          logger.error(
            { err: err.message, provider, email },
            'Fallo en la ejecución de la estrategia de correo'
          );
          results.EMAIL = {
            success: false,
            provider: 'EMAIL',
            error: err.message,
          };
        }
      }
    }

    return results as Record<NotificationProvider, NotificationResult>;
  }
}

export const notificationService = new NotificationService();
