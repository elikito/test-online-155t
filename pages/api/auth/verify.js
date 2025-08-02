export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  // Obtener tokens válidos de variable de entorno
  const validTokens = process.env.VALID_TOKENS ? process.env.VALID_TOKENS.split(',') : [];

  if (validTokens.includes(token)) {
    res.status(200).json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
}