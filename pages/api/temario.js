export default function handler(req, res) {
  const { password } = req.body;
  const PASSWORD = process.env.TEMARIO_PASSWORD || "Amapola4%";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (password === PASSWORD) {
    return res.status(200).json({
      url: "https://www.notion.so/Temario-230451f068f180439818f6244b03528e?source=copy_link"
    });
  } else {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }
}