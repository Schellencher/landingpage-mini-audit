export default async function handler(req, res) {
  // CORS / Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name = '', email = '' } = req.body || {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    const payload = {
      email,
      fields: { name },
      ...(process.env.MAILERLITE_GROUP_ID
        ? { groups: [process.env.MAILERLITE_GROUP_ID] }
        : {}),
      status: 'active',
    };

    const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    // Versuche JSON zu parsen (für bessere Fehlermeldungen)
    let ml;
    try { ml = text ? JSON.parse(text) : null; } catch (_) {}

    if (!r.ok) {
      const msg =
        (ml && (ml.error?.message || ml.message)) ||
        text ||
        'MailerLite error';
      return res.status(r.status).json({ success: false, error: msg });
    }

    // Alles gut
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
