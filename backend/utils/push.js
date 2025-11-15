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
  const q = await pool.query('SELECT endpoint, data FROM push_subscriptions');
  const subs = q.rows.map(r => ({ endpoint: r.endpoint, data: r.data })).filter(r => r.data);
  let sent = 0;
  await Promise.allSettled(subs.map(async ({ endpoint, data }) => {
    try {
      await webpush.sendNotification(data, JSON.stringify({ title, body, url }));
      sent++;
    } catch (e) {
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        // Browsers drop push subscriptions when they expire; remove them so we stop retrying
        await deleteSubscription(endpoint);
        console.warn('[push] removed stale subscription', endpoint, status);
      } else {
        console.warn('[push] failed to send to one subscription', status || e?.message || e);
      }
    }
  }));
  return { sent };
}

export async function sendPushToUser(userId, title, body, url = '/') {
  if (!configured || !userId) return { sent: 0 };
  const q = await pool.query('SELECT endpoint, data FROM push_subscriptions WHERE user_id = $1', [userId]);
  const subs = q.rows.map(r => ({ endpoint: r.endpoint, data: r.data })).filter(r => r.data);
  let sent = 0;
  await Promise.allSettled(subs.map(async ({ endpoint, data }) => {
    try {
      await webpush.sendNotification(data, JSON.stringify({ title, body, url }));
      sent++;
    } catch (e) {
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        // Browsers drop push subscriptions when they expire; remove them so we stop retrying
        await deleteSubscription(endpoint);
        console.warn('[push] removed stale subscription for user', userId, status);
      } else {
        console.warn('[push] failed to send to subscription', status || e?.message || e);
      }
    }
  }));
  return { sent };
}

async function deleteSubscription(endpoint) {
  if (!endpoint) return;
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
  } catch (e) {
    console.warn('[push] failed to delete stale subscription', e?.message || e);
  }
}

// auto-configure on import
configureWebPushFromEnv();
