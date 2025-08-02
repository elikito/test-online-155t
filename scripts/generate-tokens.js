import { randomBytes } from 'crypto';

function generateTokens(count = 3) {
  console.log('🔑 Generando tokens de acceso...\n');
  
  const tokens = [];
  
  for (let i = 0; i < count; i++) {
    const token = randomBytes(32).toString('hex');
    tokens.push(token);
    console.log(`Token ${i + 1}: ${token}`);
  }
  
  console.log('\n📋 Para usar en Vercel:');
  console.log(`VALID_TOKENS=${tokens.join(',')}`);
  
  console.log('\n🔐 Token de admin:');
  const adminToken = randomBytes(32).toString('hex');
  console.log(`ADMIN_TOKEN=${adminToken}`);
  
  console.log('\n✅ Copia estas variables a tu configuración de Vercel');
}

generateTokens();