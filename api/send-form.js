// api/send-form.js
export default async function handler(req, res) {
  // Optional: einfache CORS-Header (hilft bei Edge/Caching)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const { name, email } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing name or email' });
    }

    // ... alles oben unverändert lassen

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  return res.status(500).json({ error: 'RESEND_API_KEY is not set' });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])
);

const TO_EMAIL = 'm_scheller@outlook.com';

const payload = {
  from: 'Marcel <onboarding@resend.dev>',    // im Testmodus OK
  to: [TO_EMAIL],                             // nur an deine Login-Mail erlaubt
  subject: `Neue Mini-Audit Anfrage: ${esc(name)}`,
  html: `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">
      <h2>Neue Anfrage</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>E-Mail:</strong> ${esc(email)}</p>
    </div>
  `,
};

const resp = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

if (!resp.ok) {
  const text = await resp.text().catch(() => '');
  console.error('Resend error:', resp.status, text);
  return res.status(resp.status).json({ error: 'Resend error', details: text });
}

return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
