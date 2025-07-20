// Mock email service for development
// TODO: Replace with actual email service (Mailgun) implementation

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private env: Env

  constructor(env: Env) {
    this.env = env
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
      subject: 'Uni Feedback Admin Dashboard - Reset Your Password',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Reset Your Password</h2>
              
              <p>Hi ${username},</p>
              
              <p>You requested to reset your password for the Uni Feedback admin dashboard.</p>
              
              <p>Click the link below to reset your password:</p>
              
              <p style="margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetLink}</p>
              
              <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
              
              <p>If you didn't request this, please ignore this email.</p>
              
              <p>Cheers,<br>Afonso</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${username},

You requested to reset your password for the Uni Feedback admin dashboard.

Click the link below to reset your password:
${resetLink}

This link expires in 24 hours.

If you didn't request this, please ignore this email.

Cheers,
Afonso`
    }

    // Mock implementation - log email details
    console.log('📧 MOCK EMAIL SERVICE - Password Reset Email')
    console.log('To:', email)
    console.log('Subject:', template.subject)
    console.log('Reset Link:', resetLink)
    console.log('---')
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
      subject: 'Invitation to Uni Feedback Admin Dashboard',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">You're Invited!</h2>
              
              <p>Hi there,</p>
              
              <p>You've been invited to join the Uni Feedback Admin Dashboard.</p>
              
              <p>Click the link below to create your account:</p>
              
              <p style="margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
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

    // Mock implementation - log email details
    console.log('📧 MOCK EMAIL SERVICE - Invitation Email')
    console.log('To:', email)
    console.log('Subject:', template.subject)
    console.log('Invite Link:', inviteLink)
    console.log('---')
  }
}
