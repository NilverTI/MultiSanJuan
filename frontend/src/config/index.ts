export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  appName: 'MULTI SAN JUAN',
  appDescription: 'Sistema de inventario, ventas y caja',
  version: '1.0.0',
  currency: 'S/',
  taxRate: 0.18,
  storageKeys: {
    token: 'msj_token',
    refreshToken: 'msj_refresh',
    user: 'msj_user',
    theme: 'msj_theme',
  },
};
