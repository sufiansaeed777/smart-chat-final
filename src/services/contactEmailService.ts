import nodemailer from 'nodemailer';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  message: string;
}

export class ContactEmailService {
  /**
   * Create email transporter
   */
  private static createTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'shared.affan@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password-here'
      }
    });
  }

  /**
   * Send contact form email
   */
  static async sendContactEmail(formData: ContactFormData): Promise<boolean> {
    try {
      const transporter = this.createTransporter();

      // Email template
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission - ChatBot Pro</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #111827;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                }
                .container {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    border: 1px solid #f3f4f6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid #6566F1;
                }
                .brand-name {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 16px;
                    text-align: center;
                    letter-spacing: -0.025em;
                }
                .subtitle {
                    color: #6b7280;
                    font-size: 18px;
                    font-weight: 500;
                    margin-top: 8px;
                }
                .form-data {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                    border: 1px solid #e2e8f0;
                }
                .field {
                    margin-bottom: 20px;
                }
                .field:last-child {
                    margin-bottom: 0;
                }
                .field-label {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .field-value {
                    color: #1f2937;
                    font-size: 16px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    font-weight: 500;
                }
                .message-box {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 1px solid #f59e0b;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                }
                .message-label {
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 16px;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .message-content {
                    color: #78350f;
                    font-size: 16px;
                    line-height: 1.7;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #fbbf24;
                    font-weight: 500;
                }
                .footer {
                    text-align: center;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 14px;
                    font-weight: 500;
                }
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%);
                    color: white !important;
                    padding: 14px 28px;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 16px;
                    margin-top: 20px;
                    transition: all 0.3s ease;
                    border: none;
                    outline: none;
                    box-shadow: 0 4px 6px -1px rgba(101, 102, 241, 0.2);
                }
                .cta-button:hover {
                    background: linear-gradient(135deg, #5A5BD9 0%, #4F46E5 100%) !important;
                    color: white !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(101, 102, 241, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="brand-name">ChatBot Pro</div>
                    <div class="subtitle">New Contact Form Submission</div>
                </div>

                <div class="form-data">
                    <div class="field">
                        <div class="field-label">Name</div>
                        <div class="field-value">${formData.firstName} ${formData.lastName}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Email</div>
                        <div class="field-value">${formData.email}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Company</div>
                        <div class="field-value">${formData.company || 'Not specified'}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Phone</div>
                        <div class="field-value">${formData.phone || 'Not specified'}</div>
                    </div>
                </div>

                <div class="message-box">
                    <div class="message-label">Message</div>
                    <div class="message-content">${formData.message}</div>
                </div>

                <div style="text-align: center;">
                  <a href="mailto:${formData.email}?subject=Re: Contact Form Inquiry from ${formData.firstName} ${formData.lastName}" class="cta-button">
                    Reply to ${formData.firstName}
                  </a>
                </div>

                <div class="footer">
                    <p>This message was sent from your website contact form.</p>
                    <p>You can reply directly to this email to respond to the inquiry.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      // Send email
      const mailOptions = {
        from: `"ChatBot Pro Contact Form" <${process.env.EMAIL_USER || 'shared.affan@gmail.com'}>`,
        to: process.env.EMAIL_USER || 'shared.affan@gmail.com',
        replyTo: formData.email,
        subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
        html: emailHtml
      };

      await transporter.sendMail(mailOptions);
      console.log('[Contact Email] Email sent successfully to:', process.env.EMAIL_USER);
      return true;

    } catch (error) {
      console.error('[Contact Email] Failed to send email:', error);
      console.error('[Contact Email] EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
      console.error('[Contact Email] EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'NOT SET');
      return false;
    }
  }
}
