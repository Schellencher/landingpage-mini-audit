export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { name, email } = req.body;

    // Hier würdest du später z. B. in eine Datenbank speichern oder eine E-Mail verschicken
    console.log("Neue Anfrage:", name, email);

    // Immer Erfolg zurückgeben
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
