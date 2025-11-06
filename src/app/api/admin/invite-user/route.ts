import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager or admin
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email.toLowerCase() }
    });

    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Prevent manager from inviting themselves
    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot add your own email as a team member' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email: email.toLowerCase() } });

    if (existingUser) {
      // If user exists and has a password, do NOT modify their account
      // This prevents converting already registered users (active or inactive)
      if (existingUser.password) {
        // Return error - cannot invite already registered users
        return NextResponse.json({
          error: 'This email is already registered. Cannot send invitation to existing users.',
          userExists: true
        }, { status: 400 });
      }

      // If user exists but has no password (pending invitation), send re-invitation
      // Update their invitation token and expiry
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      existingUser.invitationToken = invitationToken;
      existingUser.tokenExpiry = tokenExpiry;
      existingUser.invitedBy = currentUser.id;
      existingUser.updatedAt = new Date();
      
      await userRepository.save(existingUser);
      
      // Send new invitation email
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      });

      const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-invitation?token=${invitationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Invitation to Join ChatBot Pro (Updated)',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to Join ChatBot Pro</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 3px solid #6566F1; border-radius: 16px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ChatBot Pro</h1>
                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">You&apos;ve been invited to join our team!</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Welcome, ${name}!</h2>
                
                <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                  You&apos;ve been invited by <strong>${currentUser.firstName} ${currentUser.lastName}</strong> to join ChatBot Pro as a <strong>${role}</strong>.
                </p>
                
                <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                  Click the button below to accept the invitation and set up your account:
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%); 
                            color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; 
                            font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(101, 102, 241, 0.3);">
                    Accept Invitation & Set Password
                  </a>
                </div>
                
                <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.5;">
                  This invitation link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  © 2024 ChatBot Pro. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Re-invitation email sent successfully to:', email);
        
        return NextResponse.json({ 
          message: 'Re-invitation sent successfully',
          userId: existingUser.id 
        });
      } catch (emailError) {
        console.error('Re-invitation email sending failed:', emailError);
        
        return NextResponse.json({ 
          message: 'Re-invitation created successfully, but email sending failed. Check server logs.',
          userId: existingUser.id,
          emailError: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with invitation token
    const newUser = userRepository.create({
      email: email.toLowerCase(),
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      role: role || 'user',
      isEmailVerified: false,
      invitationToken,
      tokenExpiry,
      invitedBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await userRepository.save(newUser);

    // Send invitation email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-invitation?token=${invitationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Invitation to Join ChatBot Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join ChatBot Pro</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 3px solid #6566F1; border-radius: 16px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ChatBot Pro</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">You&apos;ve been invited to join our team!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Welcome, ${name}!</h2>
              
              <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                You&apos;ve been invited by <strong>${currentUser.firstName} ${currentUser.lastName}</strong> to join ChatBot Pro as a <strong>${role}</strong>.
              </p>
              
              <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Click the button below to accept the invitation and set up your account:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6566F1 0%, #5A5BD9 100%); 
                          color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(101, 102, 241, 0.3);">
                  Accept Invitation & Set Password
                </a>
              </div>
              
              <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.5;">
                This invitation link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                © 2024 ChatBot Pro. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', email);
      
      return NextResponse.json({ 
        message: 'Invitation sent successfully',
        userId: newUser.id 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Still return success since user was created, but log the email error
      return NextResponse.json({ 
        message: 'User created successfully, but email sending failed. Check server logs.',
        userId: newUser.id,
        emailError: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
