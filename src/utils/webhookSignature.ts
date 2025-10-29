/**
 * PHASE 4: Signed Webhooks Utility
 *
 * Generate and verify HMAC signatures for webhooks
 * to ensure requests are authentic and haven't been tampered with
 */

import crypto from 'crypto';

/**
 * Generate HMAC signature for webhook payload
 * @param payload Webhook payload (object or string)
 * @param secret Webhook secret key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns Base64-encoded signature
 */
export function generateWebhookSignature(
  payload: any,
  secret: string,
  algorithm: string = 'sha256'
): string {
  const payloadString = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload);

  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payloadString);
  return hmac.digest('base64');
}

/**
 * Verify webhook signature
 * @param payload Webhook payload (object or string)
 * @param signature Signature from webhook header
 * @param secret Webhook secret key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret, algorithm);

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate Stripe-style signature (t=timestamp,v1=signature)
 * @param payload Webhook payload
 * @param secret Webhook secret key
 * @returns Formatted signature header
 */
export function generateStripeStyleSignature(
  payload: any,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload);

  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify Stripe-style signature
 * @param payload Webhook payload
 * @param signatureHeader Signature header value
 * @param secret Webhook secret key
 * @param toleranceSeconds Tolerance for timestamp (default: 300 = 5 minutes)
 * @returns { valid: boolean, reason?: string }
 */
export function verifyStripeStyleSignature(
  payload: any,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): { valid: boolean; reason?: string } {
  // Parse signature header
  const parts = signatureHeader.split(',');
  const timestamp = parseInt(parts.find(p => p.startsWith('t='))?.slice(2) || '0');
  const signature = parts.find(p => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) {
    return { valid: false, reason: 'Invalid signature format' };
  }

  // Check timestamp tolerance
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
    return { valid: false, reason: 'Signature timestamp too old' };
  }

  // Verify signature
  const payloadString = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload);

  const signedPayload = `${timestamp}.${payloadString}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return { valid: isValid, reason: isValid ? undefined : 'Invalid signature' };
  } catch (error) {
    return { valid: false, reason: 'Signature comparison failed' };
  }
}

/**
 * Generate webhook secret key
 * @param length Secret length (default: 32)
 * @returns Random hex string
 */
export function generateWebhookSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Middleware helper to verify webhook signature from request
 */
export function createWebhookVerifier(secret: string) {
  return (payload: any, signatureHeader: string): boolean => {
    try {
      return verifyWebhookSignature(payload, signatureHeader, secret);
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  };
}

/**
 * Example: Add signature to outgoing webhook
 */
export async function sendSignedWebhook(
  url: string,
  payload: any,
  secret: string,
  options: RequestInit = {}
): Promise<Response> {
  const signature = generateWebhookSignature(payload, secret);

  return fetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Signature-Algorithm': 'sha256',
      ...options.headers,
    },
    body: JSON.stringify(payload)
  });
}
