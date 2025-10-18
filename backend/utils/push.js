import webpush from 'web-push';
import { pool } from '../db/connect.js';

let configured = false;

export function configureWebPushFromEnv() {
  const publicKey = (process.env.WEB_PUSH_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.WEB_PUSH_PRIVATE_KEY || '').trim();
  const contact = process.env.WEB_PUSH_CONTACT || 'mailto:admin@example.com';
  const looksPlaceholder = (s) => !s || /REPLACE|CHANGE|^\s*$/.test(s);
  if (looksPlaceholder(publicKey) || looksPlaceholder(privateKey)) {
    configured = false;
    console.warn('[push] WEB_PUSH_* keys are not set or placeholder; push disabled');
    return;
  }
  try {
    webpush.setVapidDetails(contact, publicKey, privateKey);
    configured = true;
  } catch (e) {
    configured = false;
    console.warn(`[push] invalid VAPID keys: ${e?.message || e}. Push disabled.`);
  }
}

export async function sendPushToAll(title, body, url = '/') {
  if (!configured) return { sent: 0 };
  const q = await pool.query('SELECT data FROM push_subscriptions');
  const subs = q.rows.map(r => r.data).filter(Boolean);
  let sent = 0;
  await Promise.allSettled(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, JSON.stringify({ title, body, url }));
      sent++;
    } catch (e) {
      console.warn('[push] failed to send to one subscription', e?.statusCode || e?.message || e);
    }
  }));
  return { sent };
}

// auto-configure on import
configureWebPushFromEnv();
