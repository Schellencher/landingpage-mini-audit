export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    // body sicher lesen (egal ob schon geparst oder als String)
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { name, email } = body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Name und Email sind erforderlich' });
    }

    // E-Mail über Resend senden
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Marcel <onboarding@resend.dev>',     // später auf eigene Domain ändern
        to: ['M_Scheller@outlook.com'],             // <- HIER deine Zieladresse eintragen
        subject: 'Neue Mini-Audit Anfrage',
        html: `<p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>`
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(500).json({ error: 'Resend error', detail });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
