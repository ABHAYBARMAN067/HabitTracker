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

const sendRegisterOtpEmail = async ({ email, username, otp }) => {
  console.log(`\n========================================`);
  console.log(`[DEVELOPMENT MODE] Email Bypass`);
  console.log(`To: ${email}`);
  console.log(`Subject: Your HabitFlow Verification Code: ${otp}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`========================================\n`);
  return true;
};

const sendPasswordResetOtpEmail = async ({ email, username, otp }) => {
  console.log(`\n========================================`);
  console.log(`[DEVELOPMENT MODE] Email Bypass`);
  console.log(`To: ${email}`);
  console.log(`Subject: Your HabitFlow Password Reset Code: ${otp}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`========================================\n`);
  return true;
};

module.exports = { isMailConfigured, sendPasswordResetOtpEmail, sendRegisterOtpEmail };

