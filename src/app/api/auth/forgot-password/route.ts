import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');

    // Find user by email
    const user = await userRepository.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token and expiry
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await userRepository.save(user);

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransporter({
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

    await transporter.sendMail({
      from: `"ChatBot Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - ChatBot Pro',
      html: emailHtml,
    });

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
