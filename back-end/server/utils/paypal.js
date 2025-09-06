const axios = require('axios');

const ENV    = (process.env.PAYPAL_ENV || 'sandbox').trim();
const CLIENT = (process.env.PAYPAL_CLIENT_ID || '').trim();
const SECRET = (process.env.PAYPAL_SECRET || '').trim();

const API_BASE = ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  // Log seguro: muestra entorno y últimos 6 chars del client-id
  console.log('[PayPal] ENV=', ENV, 'BASE=', API_BASE, 'CID_end=', CLIENT.slice(-6));

  if (!CLIENT || !SECRET) {
    throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_SECRET');
  }

  try {
    const res = await axios.post(
      `${API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: { username: CLIENT, password: SECRET },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      }
    );
    return res.data.access_token;
  } catch (e) {
    console.error('PayPal token error:', e?.response?.data || e.message);
    throw e;
  }
}

async function captureOrder(orderId) {
  const token = await getAccessToken();
  const { data } = await axios.post(
    `${API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
  );
  return data;
}

module.exports = { captureOrder };
