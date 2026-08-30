export type NotificationProvider = 'EMAIL'; // SMS, WHATSAPP, PUSH podran integrarse en el futuro de acuerdo a los proveedores que se elijan, solo es necesario implementar la estrategia y la configuración

export interface NotificationPayload {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  variables?: Record<string, string | number>;
}

export interface NotificationResult {
  success: boolean;
  provider: NotificationProvider;
  messageId?: string;
  error?: string;
}

export interface NotificationStrategy {
  readonly provider: NotificationProvider;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}
