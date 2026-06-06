import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import numeroALetras from '@vigilio/numeros-a-letras';

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0;
  return `S/ ${num.toFixed(2)}`;
}

export function formatCurrencyWords(amount: number): string {
  const words = numeroALetras(amount, true, {
    Monedaplural: 'SOLES',
    Monedasingular: 'SOL',
    centPlural: 'CÉNTIMOS',
    centSingular: 'CÉNTIMO'
  });
  return words.toLowerCase();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-danger',
    COMPLETED: 'badge-success',
    PENDING: 'badge-warning',
    CANCELLED: 'badge-danger',
    OPEN: 'badge-success',
    CLOSED: 'badge-info',
    ACCEPTED: 'badge-success',
    EXPIRED: 'badge-danger',
    CONVERTED: 'badge-info',
    RETURNED: 'badge-warning',
  };
  return colors[status] || 'badge-info';
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName || '?')[0]}${(lastName || '')[0]}`.toUpperCase();
}

export function translateStatus(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    COMPLETED: 'Completado',
    PENDING: 'Pendiente',
    CANCELLED: 'Anulado',
    OPEN: 'Abierto',
    CLOSED: 'Cerrado',
    ACCEPTED: 'Aceptada',
    EXPIRED: 'Vencida',
    CONVERTED: 'Convertida',
    RETURNED: 'Devuelto',
    PAID: 'Pagado',
    REFUNDED: 'Reembolsado',
    PARTIALLY_PAID: 'Pago Parcial',
    MIXED: 'Mixto',
    LOGIN: 'Inicio Sesión',
    LOGOUT: 'Cierre Sesión',
    LOGIN_FAILED: 'Login Fallido',
    CREATE: 'Crear',
    UPDATE: 'Actualizar',
    DELETE: 'Eliminar',
    ACTIVATE: 'Activar',
    DEACTIVATE: 'Desactivar',
    CHANGE_ROLE: 'Cambio Rol',
    CHANGE_PERMISSION: 'Cambio Permiso',
    CHANGE_PRICE: 'Cambio Precio',
    CHANGE_STOCK: 'Cambio Stock',
    INVENTORY_MOVEMENT: 'Mov. Inventario',
    SALE_CREATED: 'Venta Creada',
    SALE_CANCELLED: 'Venta Anulada',
    SALE_RETURNED: 'Venta Devuelta',
    SALE_NOTE_CREATED: 'Nota Venta Creada',
    QUOTE_CREATED: 'Cotización Creada',
    CASH_OPEN: 'Caja Abierta',
    CASH_CLOSE: 'Caja Cerrada',
    CASH_DIFFERENCE: 'Diferencia Caja',
    PAYMENT_REGISTERED: 'Pago Registrado',
    PROMOTION_APPLIED: 'Promoción Aplicada',
    CONFIG_CHANGE: 'Cambio Configuración',
    USERS: 'Usuarios',
    PRODUCTS: 'Productos',
    CATEGORIES: 'Categorías',
    BRANDS: 'Marcas',
    SUPPLIERS: 'Proveedores',
    CUSTOMERS: 'Clientes',
    SALES: 'Ventas',
    CASH_REGISTER: 'Caja',
    INVENTORY: 'Inventario',
    PROMOTIONS: 'Promociones',
    QUOTES: 'Cotizaciones',
    SALE_NOTES: 'Notas de Venta',
    REPORTS: 'Reportes',
    AUDIT: 'Auditoría',
    SETTINGS: 'Configuración',
    ROLES: 'Roles',
    PERMISSIONS: 'Permisos',
  };
  return labels[status] || status;
}

export function translatePaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta',
    MIXED: 'Mixto',
  };
  return labels[method] || method;
}

export function translateMovementType(type: string): string {
  const labels: Record<string, string> = {
    ENTRY: 'Entrada',
    EXIT: 'Salida',
    ADJUSTMENT: 'Ajuste',
    RETURN: 'Devolución',
    SALE: 'Venta',
    CANCELLATION: 'Anulación',
    LOSS: 'Pérdida',
    EXPIRY: 'Vencimiento',
    MANUAL_CORRECTION: 'Corrección Manual',
  };
  return labels[type] || type;
}

export function translateInventoryMovementType(type: string): string {
  return translateMovementType(type);
}

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
