import nodemailer from 'nodemailer';
import { getCachedSettings } from '../utils/settingsCache.js';

let transport = null;

function getTransport(settings) {
  const host = settings.smtp_host;
  if (!host) return null;
  if (transport && transport.options?.host === host) return transport;
  transport = nodemailer.createTransport({
    host,
    port: Number(settings.smtp_port) || 587,
    secure: String(settings.smtp_secure) === '1',
    auth: settings.smtp_user
      ? { user: settings.smtp_user, pass: settings.smtp_password || '' }
      : undefined,
  });
  return transport;
}

async function loadSmtpSettings() {
  const rows = await getCachedSettings();
  return {
    smtp_host: rows.smtp_host || '',
    smtp_port: rows.smtp_port || '587',
    smtp_secure: rows.smtp_secure || '0',
    smtp_user: rows.smtp_user || '',
    smtp_password: rows.smtp_password || '',
    smtp_from: rows.smtp_from || rows.contact_email || 'no-reply@example.com',
  };
}

function layout(title, bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f4f4f5;">
    <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:20px 32px;background:#111827;">
        <span style="color:#fff;font-size:18px;font-weight:700;">${title}</span>
      </div>
      <div style="padding:28px 32px;color:#374151;font-size:15px;line-height:1.6;">${bodyHtml}</div>
      <div style="padding:16px 32px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">
        If you didn't request this email, you can safely ignore it.
      </div>
    </div>
  </body>
</html>`;
}

export async function sendMail({ to, subject, title, bodyHtml }) {
  const settings = await loadSmtpSettings();
  const mailer = getTransport(settings);
  const html = layout(title || subject, bodyHtml);
  if (!mailer) {
    console.log(`[mail] (smtp not configured) to=${to} subject="${subject}"\n${bodyHtml}`);
    return false;
  }
  try {
    await mailer.sendMail({
      from: settings.smtp_from,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return false;
  }
}
