export default async function handler(req, res) {
  // CORS auf JEDE Antwort anwenden
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Falls Vercel/Client den Body als String schickt, sicher parsen
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const rawName = (body?.name ?? '').toString().trim();
    const rawEmail = (body?.email ?? '').toString().trim().toLowerCase();

    if (!rawEmail || !/^\S+@\S+\.\S+$/.test(rawEmail)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid email' });
    }

    // MAILERLITE_GROUP_ID -> Zahl (nur wenn wirklich valide)
    let groupsPart = {};
    if (process.env.MAILERLITE_GROUP_ID) {
      const gid = Number(String(process.env.MAILERLITE_GROUP_ID).trim());
      if (Number.isFinite(gid)) {
        groupsPart = { groups: [gid] };
      }
    }

    const payload = {
      email: rawEmail,
      fields: { name: rawName },
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
    let ml = null;
    try { ml = text ? JSON.parse(text) : null; } catch { /* ignore */ }

    if (!r.ok) {
      // Aussagekräftige Fehlermeldung bauen
      const msg =
        ml?.error?.message ||
        ml?.message ||
        text ||
        'MailerLite error';
      return res
        .status(r.status || 500)
        .json({ success: false, error: msg });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, error: 'Server error' });
  }
}
