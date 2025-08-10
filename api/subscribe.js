export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const gidRaw = process.env.MAILERLITE_GROUP_ID;
    const gid = gidRaw ? Number(String(gidRaw).trim()) : null;

    // 1) Subscriber anlegen (ohne groups)
    const createResp = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        fields: { name },
        status: 'active',
      }),
    });

    let createText = await createResp.text();
    let createJson = null;
    try { createJson = createText ? JSON.parse(createText) : null; } catch {}

    // Wenn schon vorhanden (Conflict), ist das okay – wir fügen gleich zur Gruppe hinzu
    if (!createResp.ok && createResp.status !== 409) {
      const msg = (createJson && (createJson.error?.message || createJson.message)) || createText || 'MailerLite error';
      return res.status(createResp.status).json({ success: false, error: msg });
    }

    // 2) Optional: Zur Gruppe hinzufügen, falls gid vorhanden
    if (Number.isFinite(gid)) {
      const addResp = await fetch(`https://connect.mailerlite.com/api/groups/${gid}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      let addText = await addResp.text();
      let addJson = null;
      try { addJson = addText ? JSON.parse(addText) : null; } catch {}

      // 409/422 bedeuten oft „schon Mitglied“ oder „bereits vorhanden“ – das ist okay
      if (!addResp.ok && ![200, 201, 204, 409, 422].includes(addResp.status)) {
        const msg = (addJson && (addJson.error?.message || addJson.message)) || addText || 'MailerLite group error';
        return res.status(addResp.status).json({ success: false, error: msg });
      }
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
