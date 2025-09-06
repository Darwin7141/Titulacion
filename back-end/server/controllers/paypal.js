// server/controllers/paypal.js
const { captureOrder } = require('../utils/paypal');

async function capture(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ ok:false, message:'orderId es requerido' });

    const data = await captureOrder(orderId);

    // LOG: mira exactamente lo que devuelve PayPal
    console.log('[PayPal] capture payload:\n', JSON.stringify(data, null, 2));

    const orderStatus   = data?.status;
    const pu            = data?.purchase_units?.[0];
    const cap           = pu?.payments?.captures?.[0];
    const captureStatus = cap?.status;
    const amount        = cap?.amount?.value;
    const currency      = cap?.amount?.currency_code;

    return res.status(200).json({
      ok: true,
      orderStatus,          // ej. 'COMPLETED'
      captureStatus,        // ej. 'COMPLETED'
      amount,
      currency,
      raw: data
    });
  } catch (err) {
    // log completo si falla en token o en capture
    console.error('PayPal capture controller:', err?.response?.data || err.message);
    return res.status(500).json({ ok:false, message:'Error al capturar en PayPal', error: err.message });
  }
}

module.exports = { capture };
