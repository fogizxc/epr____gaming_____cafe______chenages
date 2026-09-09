// Client service for Brevo SMTP and Transactional Email operations

export interface BrevoSendOptions {
  to: string;
  toName?: string;
  subject?: string;
  type?: 'OTP_VERIFICATION' | 'PASSWORD_RESET' | 'BOOKING_CONFIRMATION' | 'CUSTOM';
  otpCode?: string;
  htmlContent?: string;
  textContent?: string;
}

export interface BrevoStatusResponse {
  configured: boolean;
  service: string;
  host: string;
  port: number;
  user: string | null;
  hasKey: boolean;
  fromEmail: string;
  fromName: string;
  smtpVerified: boolean;
  smtpError: string | null;
  ipHint?: string | null;
  serverOutboundIp?: string;
  fallbackApiAvailable: boolean;
}

export interface BrevoSendResult {
  success: boolean;
  deliveryMethod?: string;
  messageId?: string;
  error?: string;
  configured?: boolean;
  fallbackOtp?: string | null;
}

/**
 * Sends a transactional email through Brevo SMTP relay via the backend server.
 */
export async function sendBrevoEmail(options: BrevoSendOptions): Promise<BrevoSendResult> {
  try {
    const response = await fetch('/api/brevo/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('Brevo email sending API call failed:', err);
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}

/**
 * Checks Brevo SMTP configuration and connectivity status.
 */
export async function getBrevoStatus(): Promise<BrevoStatusResponse | null> {
  try {
    const response = await fetch('/api/brevo/status');
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Failed to retrieve Brevo status:', err);
    return null;
  }
}

/**
 * Triggers a test email through Brevo to verify relay delivery.
 */
export async function sendBrevoTestEmail(testEmail: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/brevo/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testEmail }),
    });

    return await response.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to dispatch test email',
    };
  }
}
