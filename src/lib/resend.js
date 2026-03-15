import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email, name) {
  try {
    await resend.emails.send({
      from: 'Graceway <noreply@graceway-platform.vercel.app>',
      to: email,
      subject: 'Welcome to Graceway Generation!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A2463; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Graceway Generation</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0A2463;">Hi ${name}!</h2>
            <p>Welcome to Graceway Generation — your digital discipleship journey starts now.</p>
            <p>The discipleship growth loop: <strong>Recruit → Root → Certify → Multiply → Lead → Repeat</strong></p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #FF6D00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
              Start Learning
            </a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

export async function sendCertificateEmail(email, name, courseName, certificateUrl) {
  try {
    await resend.emails.send({
      from: 'Graceway <noreply@graceway-platform.vercel.app>',
      to: email,
      subject: `Congratulations! You earned a certificate for ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A2463; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Certificate Earned! 🎉</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0A2463;">Congratulations, ${name}!</h2>
            <p>You have successfully completed <strong>${courseName}</strong> and earned your certificate.</p>
            <a href="${certificateUrl}" 
               style="background: #4CAF50; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
              View Your Certificate
            </a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending certificate email:', error);
  }
}
