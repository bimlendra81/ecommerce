import { pool } from '../config/db.js';
import { sendMail } from '../services/email.js';
import { getCachedSettings } from '../utils/settingsCache.js';

export async function createMessage(req, res, next) {
  try {
    const { name, email, message } = req.body;
    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    const settings = await getCachedSettings();
    if (settings.contact_email) {
      await sendMail({
        to: settings.contact_email,
        subject: `New contact message from ${name}`,
        title: 'Contact message',
        bodyHtml: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/</g, '&lt;')}</p>`,
      });
    }
    res.status(201).json({ message: 'Message sent. We will get back to you soon.', id: result.insertId });
  } catch (err) {
    next(err);
  }
}
