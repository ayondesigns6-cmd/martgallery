export interface SendSmsParams {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface ISmsProvider {
  sendSms(params: SendSmsParams): Promise<SmsResult>;
}

class MockSmsProvider implements ISmsProvider {
  async sendSms(params: SendSmsParams): Promise<SmsResult> {
    console.log(`[Mock SMS] To: ${params.to} | Message: ${params.message}`);
    return {
      success: true,
      provider: 'mock',
      messageId: `mock-sms-${Date.now()}`,
    };
  }
}

class GenericHttpSmsProvider implements ISmsProvider {
  private apiUrl: string;
  private apiKey: string;
  private senderId?: string;

  constructor() {
    this.apiUrl = process.env.SMS_API_URL || '';
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || '';
  }

  async sendSms(params: SendSmsParams): Promise<SmsResult> {
    if (!this.apiUrl || !this.apiKey) {
      console.warn('[SMS Provider] API credentials missing, falling back to mock');
      return new MockSmsProvider().sendSms(params);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          sender_id: this.senderId,
          recipient: params.to,
          message: params.message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          provider: 'generic_http',
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        provider: 'generic_http',
        messageId: data.message_id || data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'generic_http',
        error: err.message || 'Network failure while sending SMS',
      };
    }
  }
}

export function getSmsProvider(): ISmsProvider {
  const provider = process.env.SMS_PROVIDER || 'mock';
  switch (provider.toLowerCase()) {
    case 'generic_http':
    case 'greenweb':
    case 'bulksmsbd':
      return new GenericHttpSmsProvider();
    case 'mock':
    default:
      return new MockSmsProvider();
  }
}
