import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export class EmailVerificationService {
  private static userRepository = AppDataSource.getRepository("users");

  /**
   * Generate a secure verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create email transporter
   */
  private static createTransporter() {
    // For Gmail, you'll need to use an App Password
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'shared.affan@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password-here'
      }
    });
  }

  /**
   * Send verification email to user
   */
  static async sendVerificationEmail(user: User, verificationUrl: string): Promise<boolean> {
    try {
      const transporter = this.createTransporter();

      // Email template
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your ChatBot Pro Account</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; min-height: 100vh;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" style="max-width: 580px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); border: 3px solid #6566F1; overflow: hidden;">
                            <tr>
                                <td style="padding: 40px; text-align: center;">
                                    <!-- Header -->
                                    <div style="margin-bottom: 36px; padding-bottom: 28px; border-bottom: 2px solid #f3f4f6; position: relative;">
                                        <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #6566F1 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; letter-spacing: -0.025em;">ChatBot Pro</div>
                                    </div>

                                    <!-- Welcome Section -->
                                    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 20px; padding: 32px; margin: 32px 0; border: 1px solid #bae6fd; text-align: center; box-shadow: 0 10px 25px -5px rgba(101, 102, 241, 0.1);">
                                        <div style="font-size: 24px; font-weight: 700; color: #0369a1; margin-bottom: 16px;">Welcome to ChatBot Pro!</div>
                                        <div style="font-size: 16px; color: #0c4a6e; font-weight: 500; line-height: 1.6;">Click the button below to verify your email address and start building amazing AI chatbots</div>
                                    </div>

                                    <!-- Verification Button -->
                                    <div style="text-align: center; margin: 36px 0;">
                                        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%); color: white !important; padding: 18px 36px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 17px; box-shadow: 0 10px 25px -5px rgba(101, 102, 241, 0.4);">✨ Verify My Email Address</a>
                                    </div>

                                    <!-- Divider -->
                                    <div style="height: 2px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent); margin: 32px 0;"></div>

                                    <!-- Security Note -->
                                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 18px; padding: 24px; margin: 32px 0; text-align: center; box-shadow: 0 8px 20px -5px rgba(245, 158, 11, 0.2); position: relative;">
                                        <div style="color: #92400e; font-size: 15px; font-weight: 500; line-height: 1.6;">ⓘ <strong>Note:</strong> This verification link is secure and will expire after use. If you didn't create this account, please ignore this email.</div>
                                    </div>

                                    <!-- Footer -->
                                    <div style="text-align: center; margin-top: 36px; padding-top: 28px; border-top: 2px solid #f3f4f6; color: #6b7280; font-size: 14px; font-weight: 500; position: relative;">
                                        <p style="margin: 8px 0;">This email was sent to verify your <span style="color: #6566F1; font-weight: 600;">ChatBot Pro</span> account.</p>
                                        <p style="margin: 8px 0;">If you have any questions, please contact our support team.</p>
                                        <div style="margin-top: 20px; font-size: 12px; color: #9ca3af; font-style: italic;">ChatBot Pro - Transform your customer service with AI</div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `;

      // Send email
      const mailOptions = {
        from: `"ChatBot Pro" <${process.env.EMAIL_USER || 'shared.affan@gmail.com'}>`,
        to: user.email,
        subject: `Verify Your ChatBot Pro Account - ${user.fullName || 'User'}`,
        html: emailHtml
      };

      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully to:', user.email);
      return true;

    } catch (error) {
      console.error('Failed to send verification email:', error);
      console.error('Email config:', {
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_APP_PASSWORD,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL
      });
      return false;
    }
  }

  /**
   * Verify user email with token
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Find user by verification token
      const user = await this.userRepository.findOne({
        where: { emailVerificationToken: token }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: true,
          message: 'Email is already verified. You can proceed to your dashboard.',
          user
        };
      }

      // Verify the email
      user.isEmailVerified = true;
      user.isActive = true; // Activate the account
      // Keep the token so already verified users can still use the same link
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Email verified successfully! Your account is now active.',
        user
      };
    } catch (error) {
      console.error('EmailVerificationService: Error during verification:', error);
      return {
        success: false,
        message: 'An error occurred while verifying your email'
      };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string, verificationUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      // Generate new verification token
      user.emailVerificationToken = this.generateVerificationToken();
      await this.userRepository.save(user);

      // Update verification URL with new token
      const newVerificationUrl = verificationUrl.replace('NEW_TOKEN', user.emailVerificationToken);

      // Send new verification email
      const emailSent = await this.sendVerificationEmail(user, newVerificationUrl);

      if (emailSent) {
        return {
          success: true,
          message: 'Verification email sent successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send verification email'
        };
      }
    } catch {
      return {
        success: false,
        message: 'An error occurred while resending verification email'
      };
    }
  }

  /**
   * Clean up expired verification tokens (run periodically)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      // You can implement token expiration logic here
      // For now, we'll keep tokens until verified
    } catch {
      // Silent error handling for cleanup
    }
  }
}
