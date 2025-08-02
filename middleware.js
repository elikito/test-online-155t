import { NextResponse } from 'next/server';

export function middleware(request) {
  // En desarrollo, permitir acceso sin autenticación si no hay variables configuradas
  if (process.env.NODE_ENV === 'development' && !process.env.VALID_TOKENS) {
    console.log('🔓 Desarrollo: Saltando autenticación (no hay VALID_TOKENS configurado)');
    return NextResponse.next();
  }

  // Rutas que NO requieren autenticación
  const publicPaths = ['/api/auth/verify', '/login'];
  
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Verificar token en cookies
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verificar si el token es válido
  const validTokens = process.env.VALID_TOKENS ? process.env.VALID_TOKENS.split(',') : [];
  
  if (!validTokens.includes(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};