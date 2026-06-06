export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  dni?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: RolePermission[];
  _count?: { users: number };
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  unitType: string;
  purchasePrice: number;
  salePrice: number;
  profitMargin: number;
  stock: number;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  category?: Category;
  subcategory?: Subcategory;
  brand?: Brand;
  supplier?: Supplier;
  barcodes: ProductBarcode[];
  presentations: ProductPresentation[];
  images: ProductImage[];
  mainImageUrl?: string;
  createdAt: string;
}

export interface ProductBarcode {
  id: string;
  barcode: string;
}

export interface ProductPresentation {
  id: string;
  name: string;
  quantity: number;
  salePrice: number;
  barcode?: string;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  subcategories?: Subcategory[];
  _count?: { products: number };
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  ruc?: string;
}

export interface Customer {
  id: string;
  dni?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  sales?: Sale[];
  createdAt: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  igv: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  notes?: string;
  userId: string;
  customerId?: string;
  cashRegisterId?: string;
  user?: { id: string; firstName: string; lastName: string };
  customer?: Customer;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  presentationId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
  product?: Product;
}

export interface SalePayment {
  id: string;
  method: 'CASH' | 'YAPE' | 'PLIN' | 'TRANSFER' | 'CARD' | 'MIXED';
  amount: number;
  reference?: string;
}

export interface CashRegister {
  id: string;
  date: string;
  status: 'OPEN' | 'CLOSED';
  initialAmount: number;
  expectedCash: number;
  expectedYape: number;
  expectedPlin: number;
  expectedTransfer: number;
  expectedCard: number;
  expectedTotal: number;
  countedCash: number;
  countedYape: number;
  countedPlin: number;
  countedTransfer: number;
  countedCard: number;
  countedTotal: number;
  difference: number;
  observations?: string;
  openedBy: { id: string; firstName: string; lastName: string };
  closedBy?: { id: string; firstName: string; lastName: string };
  openedAt: string;
  closedAt?: string;
  sales?: Sale[];
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN' | 'SALE' | 'CANCELLATION' | 'LOSS' | 'EXPIRY';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  notes?: string;
  product?: { id: string; name: string; sku: string };
  user?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'PRODUCT' | 'CATEGORY' | 'QUANTITY' | 'COMBO' | 'DATE';
  discountType: 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y';
  discountValue: number;
  minQuantity?: number;
  maxQuantity?: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  rules: PromotionRule[];
}

export interface PromotionRule {
  id: string;
  promotionId: string;
  productId?: string;
  categoryId?: string;
  quantity?: number;
  freeProductId?: string;
  discountExtra?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED' | 'CONVERTED';
  validUntil?: string;
  notes?: string;
  customer?: Customer;
  user?: User;
  items: QuoteItem[];
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SaleNote {
  id: string;
  noteNumber: string;
  customerId?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'CONVERTED' | 'CANCELLED';
  notes?: string;
  customer?: Customer;
  user?: User;
  items: SaleNoteItem[];
  createdAt: string;
}

export interface SaleNoteItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  module: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  referenceId?: string;
  user?: { id: string; firstName: string; lastName: string; username: string };
  createdAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  totalSales: number;
  totalProducts: number;
  lowStockProducts: number;
  cashRegisterOpen: boolean;
  openRegister: CashRegister | null;
  topProducts: { id: string; name: string; sku: string; totalSold: number }[];
  salesByPaymentMethod: { method: string; total: number }[];
  financial: {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMargin: number;
    totalProductsSold: number;
    uniqueCustomers: number;
    avgTicket: number;
  };
  productsRanking: {
    byQuantity: { rank: number; id: string; name: string; sku: string; qty: number; revenue: number; cost: number }[];
    byRevenue: { rank: number; id: string; name: string; sku: string; qty: number; revenue: number; cost: number }[];
    mostSold: { id: string; name: string; qty: number; revenue: number } | null;
    leastSold: { id: string; name: string; qty: number; revenue: number } | null;
  };
  customersRanking: { rank: number; id: string; firstName: string; lastName: string; email?: string; dni?: string; salesCount: number; totalSpent: number }[];
  salesTimeline: { date: string; revenue: number; count: number; cost: number }[];
  bestDay: { date: string; revenue: number; count: number } | null;
  bestWeek: { week: string; revenue: number; count: number } | null;
  bestMonth: { month: string; revenue: number; count: number } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
