import { Resend } from 'resend'
import { sendEmailStatusNotification } from './telegram'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private env: Env
  private resend: Resend

  constructor(env: Env) {
    this.env = env
    this.resend = new Resend(env.RESEND_API_KEY)
  }

  private async sendEmail(params: {
    from: string
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void> {
    const isDevelopment = this.env.NODE_ENV === 'development'

    // In development mode, just log the email instead of sending
    if (isDevelopment) {
      console.log('📧 EMAIL MOCK (Development Mode)')
      console.log('From:', params.from)
      console.log('To:', params.to)
      console.log('Subject:', params.subject)
      console.log('HTML length:', params.html.length)
      console.log('Text length:', params.text.length)
      console.log('---')
      return
    }

    // In production, send the actual email
    try {
      await this.resend.emails.send(params)
      console.log(`✅ Email sent successfully to ${params.to}`)

      // Send telegram notification for successful email
      await sendEmailStatusNotification(this.env, {
        email: params.to,
        emailType: params.subject,
        success: true
      })
    } catch (error) {
      console.error('❌ Failed to send email:', error)

      // Send telegram notification for failed email
      await sendEmailStatusNotification(this.env, {
        email: params.to,
        emailType: params.subject,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(`Failed to send email to ${params.to}`)
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string,
    dashboardUrl: string
  ): Promise<void> {
    const resetLink = `${dashboardUrl}/reset-password?token=${resetToken}`

    const template: EmailTemplate = {
      subject: 'Uni Feedback - Reset Your Password',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #23729f;">Reset Your Password</h2>
              
              <p>Hi ${username},</p>
              
              <p>Click the link below to reset your password:</p>
              
              <p style="margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #23729f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetLink}</p>
              
              <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
              
              <p>If you didn't request a password, you can safely ignore this email.</p>
              
              <p>Cheers,<br>Afonso</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${username},

Click the link below to reset your password:
${resetLink}

This link expires in 24 hours.

If you didn't request a password, you can safely ignore this email.

Cheers,
Afonso`
    }

    await this.sendEmail({
      from: 'Uni Feedback <noreply@uni-feedback.com>',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  /**
   * Send user invitation email
   */
  async sendInvitationEmail(
    email: string,
    inviteToken: string,
    dashboardUrl: string
  ): Promise<void> {
    const inviteLink = `${dashboardUrl}/create-account?token=${inviteToken}`

    const template: EmailTemplate = {
      subject: 'Welcome to Uni Feedback!!',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #23729f;">You're Invited!</h2>
              
              <p>Hi there,</p>
              
              <p>You've been invited to join the Uni Feedback Admin Dashboard.</p>
              
              <p>Click the button below to create your account:</p>
              
              <p style="margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="background-color: #23729f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Create Account
                </a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${inviteLink}</p>
              
              <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
              
              <p>Cheers,<br>Afonso</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi there,

You've been invited to join the Uni Feedback Admin Dashboard.

Click the link below to create your account:
${inviteLink}

This link expires in 7 days.

Cheers,
Afonso`
    }

    await this.sendEmail({
      from: 'Uni Feedback <noreply@uni-feedback.com>',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }
}
