export default async function handler(req, res) {
  // CORS immer setzen (für Form-POSTs aus deiner statischen Seite)
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name = '', email = '' } = req.body || {};

    // simple E-Mail-Check
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    // --- Gruppe vorbereiten ---
    // MailerLite erwartet reine Zahl. Alles außer Ziffern weg (zur Sicherheit).
    let groupsPart = {};
    if (process.env.MAILERLITE_GROUP_ID) {
      const cleaned = String(process.env.MAILERLITE_GROUP_ID).trim().replace(/\D/g, '');
      const gid = Number(cleaned);
      if (Number.isFinite(gid)) {
        groupsPart = { groups: [gid] };
      }
    }

    const payload = {
      email,
      fields: { name },
      ...groupsPart,
      status: 'active',
    };

    // ----- DEBUG LOGS (in Vercel > Logs sichtbar) -----
    console.log('subscribe: payload ->', payload);
    console.log(
      'subscribe: envs ->',
      { hasApiKey: Boolean(process.env.MAILERLITE_API_KEY), groupIdRaw: process.env.MAILERLITE_GROUP_ID }
    );
    // ---------------------------------------------------

    const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let ml;
    try { ml = text ? JSON.parse(text) : null; } catch (_) {}

    // nochmal debuggen, was MailerLite zurückgibt
    console.log('subscribe: ML status ->', r.status);
    console.log('subscribe: ML body ->', text);

    if (!r.ok) {
      const msg =
        (ml && (ml.error?.message || ml.message)) ||
        text ||
        'MailerLite error';
      return res.status(r.status || 422).json({ success: false, error: msg });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('subscribe: server error ->', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
