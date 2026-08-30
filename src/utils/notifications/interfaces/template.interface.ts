export type EmailTemplateRenderer = (
  data: Record<string, string>
) => { html: string; text?: string } | string;

export interface EmailTemplateConfig {
  subject: string;
  template: EmailTemplateRenderer;
  data: Record<string, string>;
}

export interface WhatsAppTemplateConfig {
  templateSid?: string;
  variables?: Record<string, string>;
  data?: Record<string, string>;
}

export interface SmsTemplateConfig {
  content?: string;
  data?: Record<string, string>;
}

export interface PushTemplateConfig {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export interface SubcaseTemplates {
  EMAIL?: EmailTemplateConfig;
  WHATSAPP?: WhatsAppTemplateConfig;
  SMS?: SmsTemplateConfig;
  PUSH?: PushTemplateConfig;
}

export type NotificationCatalog = Record<
  string, // TemplateName (ej. USER_NOTIFICATIONS)
  Record<string, SubcaseTemplates> // Subcaso (ej. REGISTRO_DE_USUARIO)
>;
