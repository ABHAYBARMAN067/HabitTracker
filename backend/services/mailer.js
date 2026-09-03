const nodemailer = require('nodemailer');

const requiredSettings = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS', 'MAIL_FROM'];

const isMailConfigured = () => requiredSettings.every(key => Boolean(process.env[key]));

const getTransporter = () => nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

const sendPasswordResetEmail = async ({ email, username, token }) => {
  if (!isMailConfigured()) throw new Error('Email service is not configured');

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const separator = clientUrl.includes('?') ? '&' : '?';
  const resetUrl = `${clientUrl}${separator}resetToken=${encodeURIComponent(token)}`;
  const name = escapeHtml(username);

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Reset your HabitFlow password',
    text: `Hi ${username}, reset your HabitFlow password using this link: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p>Use the link below to reset your HabitFlow password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
};

const sendRegisterOtpEmail = async ({ email, username, otp }) => {
  if (!isMailConfigured()) throw new Error('Email service is not configured');

  const name = escapeHtml(username);

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `Your HabitFlow Verification Code: ${otp}`,
    text: `Hi ${username},\n\nYour verification code to complete your registration is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #13141f; color: #ffffff; border-radius: 16px; border: 1px solid rgba(0, 255, 255, 0.3);">
        <h2 style="color: #00f2fe; text-align: center; margin-top: 0;">HabitFlow Account Verification</h2>
        <p style="color: #d1d5db; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #9ca3af; font-size: 14px;">Thank you for joining HabitFlow. Please use the following 6-digit verification code to complete your registration:</p>
        
        <div style="background: rgba(0, 242, 254, 0.1); border: 2px dashed #00f2fe; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00ffff; font-family: monospace;">${otp}</span>
        </div>

        <p style="color: #9ca3af; font-size: 13px; text-align: center;">⏱️ This code will expire in <strong>10 minutes</strong>.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-bottom: 0;">If you did not attempt to register on HabitFlow, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { isMailConfigured, sendPasswordResetEmail, sendRegisterOtpEmail };

