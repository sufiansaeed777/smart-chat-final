import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { ILike } from 'typeorm';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    console.log('[Forgot Password] API called');
    const { email } = await request.json();
    console.log('[Forgot Password] Email received:', email);

    if (!email) {
      console.log('[Forgot Password] No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('[Forgot Password] Email configuration missing!');
      console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
      console.error('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'SET' : 'MISSING');
      return NextResponse.json({
        error: 'Email service is not configured. Please contact support.'
      }, { status: 500 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      console.log('[Forgot Password] Initializing database...');
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    console.log('[Forgot Password] User repository initialized');

    // Find user by email (case-insensitive)
    console.log('[Forgot Password] Looking up user with email:', email);
    const user = await userRepository.findOne({ where: { email: ILike(email) } });

    // Return error if email is not registered
    if (!user) {
      console.log('[Forgot Password] User not found for email:', email);
      return NextResponse.json({
        error: 'No account found with this email address. Please check the email or sign up for a new account.'
      }, { status: 404 });
    }

    console.log('[Forgot Password] User found:', user.id);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    console.log('[Forgot Password] Generated reset token, expires:', resetExpires);

    // Save reset token and expiry
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await userRepository.save(user);

    console.log('[Forgot Password] Reset token saved to database');

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;
    console.log('[Forgot Password] Reset URL:', resetUrl);

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);">
              <tr>
                  <td align="center" style="padding: 40px 20px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" style="max-width: 580px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); border: 3px solid #6566F1; overflow: hidden;">
                          <tr>
                              <td style="padding: 40px; text-align: center;">
                                  <!-- Header -->
                                  <div style="margin-bottom: 36px; padding-bottom: 28px; border-bottom: 2px solid #f3f4f6;">
                                      <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #6566F1 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px;">ChatBot Pro</div>
                                  </div>

                                  <!-- Main Content -->
                                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 20px; padding: 32px; margin: 32px 0; border: 1px solid #bae6fd; text-align: center;">
                                      <div style="font-size: 24px; font-weight: 700; color: #0369a1; margin-bottom: 16px;">Reset Your Password</div>
                                      <div style="font-size: 16px; color: #0c4a6e; font-weight: 500; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</div>
                                  </div>

                                  <!-- Reset Button -->
                                  <div style="text-align: center; margin: 36px 0;">
                                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%); color: white !important; padding: 18px 36px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 17px; box-shadow: 0 10px 25px -5px rgba(101, 102, 241, 0.4);">Reset Password</a>
                                  </div>

                                  <!-- Divider -->
                                  <div style="height: 2px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent); margin: 32px 0;"></div>

                                  <!-- Security Note -->
                                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 18px; padding: 24px; margin: 32px 0; text-align: center;">
                                      <div style="color: #92400e; font-size: 15px; font-weight: 500; line-height: 1.6;">ⓘ <strong>Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</div>
                                  </div>

                                  <!-- Footer -->
                                  <div style="text-align: center; margin-top: 36px; padding-top: 28px; border-top: 2px solid #f3f4f6; color: #6b7280; font-size: 14px; font-weight: 500;">
                                      <p style="margin: 8px 0;">This email was sent from <span style="color: #6566F1; font-weight: 600;">ChatBot Pro</span>.</p>
                                      <p style="margin: 8px 0;">If you have any questions, please contact our support team.</p>
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

    // Verify email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('[Forgot Password] ERROR: Email credentials not configured');
      console.error('[Forgot Password] EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
      console.error('[Forgot Password] EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'NOT SET');
      throw new Error('Email service not configured. Please contact support.');
    }

    console.log('[Forgot Password] Sending email to:', email);
    console.log('[Forgot Password] Sending from:', process.env.EMAIL_USER);

    const emailInfo = await transporter.sendMail({
      from: `"ChatBot Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - ChatBot Pro',
      html: emailHtml,
    });

    console.log('[Forgot Password] Email sent successfully!');
    console.log('[Forgot Password] Email response:', emailInfo.response);
    console.log('[Forgot Password] Message ID:', emailInfo.messageId);

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });

  } catch (error) {
    console.error('[Forgot Password] ERROR:', error);
    console.error('[Forgot Password] Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to process request. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
