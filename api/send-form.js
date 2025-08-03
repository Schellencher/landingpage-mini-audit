export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { name, email } = req.body;

    // --- Hier kannst du später z. B. in Datenbank speichern oder Mail versenden ---
    console.log("Neue Anfrage erhalten:", name, email);

    // Antworte sofort erfolgreich an den Browser
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
