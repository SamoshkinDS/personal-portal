// encoding: utf-8

export async function registerPush() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    // Ask for permission if not decided
    if (Notification && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    // Subscribe (optional) if permission granted and push supported
    if (!('PushManager' in window) || Notification.permission !== 'granted') return true;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await sendSubscription(existing);
      return true;
    }
    const vapidKey = await resolveVapidPublicKey();
    if (!vapidKey) {
      // Surface the misconfiguration that caused the browser error
      console.error('registerPush: Missing VAPID public key (env or /api/notifications/public-key)');
      return false;
    }
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey), // Convert base64 key into the Uint8Array required by subscribe()
    };
    const sub = await reg.pushManager.subscribe(subscribeOptions);
    await sendSubscription(sub);
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('registerPush error', e);
    return false;
  }
}

async function resolveVapidPublicKey() {
  const envKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
  if (envKey) return envKey;
  try {
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const url = `${base || ''}/api/notifications/public-key`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch VAPID key (${res.status})`);
    }
    const data = await res.json();
    return (data?.publicKey || '').trim();
  } catch (e) {
    console.error('registerPush: Unable to fetch VAPID public key from server', e);
    return '';
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscription(sub) {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(sub),
    });
  } catch (e) {
    // ignore
  }
}
