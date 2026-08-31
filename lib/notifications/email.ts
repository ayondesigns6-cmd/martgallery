export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  sendEmail(params: SendEmailParams): Promise<EmailResult>;
}

class MockEmailProvider implements IEmailProvider {
  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    console.log(`[Mock Email] To: ${params.to} | Subject: ${params.subject}`);
    return {
      success: true,
      provider: 'mock',
      messageId: `mock-email-${Date.now()}`,
    };
  }
}

class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.from = process.env.EMAIL_FROM || 'Mart Gallery <orders@martgallery.com>';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    if (!this.apiKey) {
      console.warn('[Email Provider] Resend API Key missing, falling back to mock');
      return new MockEmailProvider().sendEmail(params);
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          provider: 'resend',
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        provider: 'resend',
        messageId: data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'resend',
        error: err.message || 'Failed to dispatch email via Resend',
      };
    }
  }
}

export function getEmailProvider(): IEmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'mock';
  switch (provider.toLowerCase()) {
    case 'resend':
      return new ResendEmailProvider();
    case 'mock':
    default:
      return new MockEmailProvider();
  }
}
