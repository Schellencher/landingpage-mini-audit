export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { name, email } = req.body;

    // Daten an Formspree weiterleiten
    const response = await fetch("https://formspree.io/f/meozlpjl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Formspree error" });
    }

    // Erfolgsmeldung
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
