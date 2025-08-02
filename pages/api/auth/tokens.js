import { randomBytes } from 'crypto';

export default function handler(req, res) {
  // Solo permitir si es admin
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    // Obtener lista de tokens
    const tokens = process.env.VALID_TOKENS ? process.env.VALID_TOKENS.split(',') : [];
    const tokenList = tokens.map((token, index) => ({
      id: index,
      preview: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
      created: new Date().toISOString(),
      full: token // Incluir token completo para copiar
    }));
    
    return res.status(200).json({ tokens: tokenList });
  }

  if (req.method === 'POST') {
    // Generar nuevo token
    const newToken = randomBytes(32).toString('hex');
    
    return res.status(200).json({ 
      token: newToken,
      message: 'Token generado. Añádelo a la variable de entorno VALID_TOKENS' 
    });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}