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

module.exports = { isMailConfigured, sendPasswordResetEmail };
