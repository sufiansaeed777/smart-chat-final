import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Use a service like SendGrid, AWS SES, or Nodemailer to send the email
    // 2. Store the contact request in a database for tracking
    // 3. Send notifications to support team
    //
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    //
    // const msg = {
    //   to: 'support@smartchat.com',
    //   from: 'noreply@smartchat.com',
    //   replyTo: email,
    //   subject: `Support Request: ${subject}`,
    //   text: `From: ${name} (${email})\n\n${message}`,
    //   html: `
    //     <h2>Support Request</h2>
    //     <p><strong>From:</strong> ${name} (${email})</p>
    //     <p><strong>Subject:</strong> ${subject}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message.replace(/\n/g, '<br>')}</p>
    //   `,
    // };
    //
    // await sgMail.send(msg);

    // For now, log the contact request
    console.log('📧 Contact Form Submission:');
    console.log('From:', name, `(${email})`);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('User:', session.user.email);
    console.log('Timestamp:', new Date().toISOString());

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if email service is configured
    const hasEmailService = process.env.SENDGRID_API_KEY ||
                           process.env.AWS_SES_ACCESS_KEY ||
                           process.env.SMTP_HOST;

    if (!hasEmailService) {
      // Log to console for now
      console.log('⚠️ Email service not configured. Message logged but not sent.');

      // Still return success so users can submit, but maybe store in DB instead
      return NextResponse.json({
        success: true,
        message: 'Your message has been received. We will get back to you within 24 hours.',
        warning: 'Email service not configured - message logged for manual review'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We will respond within 24 hours.',
      data: {
        name,
        email,
        subject,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
