export default async function handler(req, res) {
  // CORS immer setzen
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
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    // Group-ID in Zahl umwandeln (und nur setzen, wenn gültig)
    let groupsPart = {};
    if (process.env.MAILERLITE_GROUP_ID) {
      const gid = Number(String(process.env.MAILERLITE_GROUP_ID).trim());
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
    let ml; try { ml = text ? JSON.parse(text) : null; } catch {}

    if (!r.ok) {
      const msg =
        (ml && (ml.error?.message || ml.message)) ||
        text ||
        'MailerLite error';
      return res.status(r.status).json({ success: false, error: msg });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
