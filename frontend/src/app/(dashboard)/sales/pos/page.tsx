'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { productsApi, customersApi, salesApi, cashRegisterApi } from '@/services/api';
import { formatCurrency, formatCurrencyWords, cn, translatePaymentMethod } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import {
  Search, Barcode, Plus, Minus, Trash2, User, X, Check,
  ShoppingCart, DollarSign, Smartphone, Building2, CreditCard,
  Printer, FileText, Loader2, Package, ScanLine, ChevronDown,
} from 'lucide-react';
import { generateReceiptPDF } from '@/lib/pdf-generator';
import type { Product, Customer } from '@/types';

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface PaymentEntry {
  method: 'CASH' | 'YAPE' | 'PLIN' | 'TRANSFER' | 'CARD';
  amount: number;
}

const paymentMethods = ['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'] as const;

const paymentIcons: Record<string, React.ReactNode> = {
  CASH: <DollarSign size={20} />,
  YAPE: <Smartphone size={20} />,
  PLIN: <Smartphone size={20} />,
  TRANSFER: <Building2 size={20} />,
  CARD: <CreditCard size={20} />,
};

export default function POSPage() {
  const { user } = useAuth();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    dni: '', firstName: '', lastName: '', email: '', phone: '', address: ''
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false);

  useEffect(() => {
    cashRegisterApi.current().then((res: any) => {
      setCashRegisterOpen(res.register?.status === 'OPEN');
    }).catch(() => {});
    productsApi.getAll({ limit: 50 }).then(res => setProducts(res.data || []));
    customersApi.getAll({ limit: 5 }).then(res => setCustomers(res.data || []));
  }, []);

  const handleSaveCustomer = async () => {
    if (!newCustomerForm.firstName.trim() || !newCustomerForm.dni.trim()) {
      toast.error('DNI y Nombres son obligatorios');
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await customersApi.create(newCustomerForm);
      setCustomer(res);
      toast.success('Cliente registrado');
      setIsAddingCustomer(false);
      setNewCustomerForm({ dni: '', firstName: '', lastName: '', email: '', phone: '', address: '' });
    } catch (err: any) { 
      toast.error(err.message || 'Error al registrar cliente'); 
    } finally {
      setSavingCustomer(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length < 2) { setShowResults(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await productsApi.getAll({ search: searchQuery, limit: 10 });
        setSearchResults(res.data || []);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    if (!barcode) return;
    setSearching(true);
    setSearchQuery(barcode); // This will also trigger the visual search state
    try {
      const product = await productsApi.findByBarcode(barcode);
      if (product) {
        setSearchResults([product]);
      } else {
        setSearchResults([]);
        toast.error('Producto no encontrado');
      }
    } catch {
      setSearchResults([]);
      toast.error('Error al buscar producto');
    } finally {
      setSearching(false);
    }
  }, []);

  const addToCart = (product: Product, price?: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice - item.discount }
            : item
        );
      }
      const unitPrice = price || product.salePrice;
      return [...prev, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice,
        discount: 0,
        total: unitPrice,
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta), total: Math.max(1, item.quantity + delta) * item.unitPrice - item.discount }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const totalDiscount = useMemo(() => cart.reduce((sum, item) => sum + item.discount, 0) + discount, [cart, discount]);
  const igv = useMemo(() => (subtotal - totalDiscount) * 0.18, [subtotal, totalDiscount]);
  const total = useMemo(() => subtotal - totalDiscount + igv, [subtotal, totalDiscount, igv]);
  const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const searchCustomers = async (query: string) => {
    setCustomerQuery(query);
    const res = await customersApi.getAll({ search: query, limit: 5 });
    setCustomers(res.data || []);
  };

  const handleCheckout = async () => {
    if (!cashRegisterOpen) {
      toast.error('Debe abrir la caja primero');
      return;
    }
    if (cart.length === 0) {
      toast.error('Agregue productos al carrito');
      return;
    }
    if (payments.length === 0) {
      toast.error('Seleccione un método de pago');
      return;
    }

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPayments < total - 0.01) {
      toast.error(`El total de pagos (${formatCurrency(totalPayments)}) es menor al total (${formatCurrency(total)})`);
      return;
    }

    const change = totalPayments > total ? totalPayments - total : 0;
    const saleNotes = change > 0 ? `Vuelto: ${formatCurrency(change)}` : '';

    setProcessing(true);
    try {
      const res = await salesApi.create({
        customerId: customer?.id,
        subtotal,
        discount: totalDiscount,
        igv,
        total,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        payments: payments.map(p => ({
          method: p.method,
          amount: p.amount,
        })),
        notes: saleNotes,
      });

      toast.success('Venta registrada exitosamente');
      
      // Generate PDF
      if (res) {
        generateReceiptPDF(res);
      }

      setCart([]);
      setPayments([]);
      setDiscount(0);
      setCustomer(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
    }
  };

  return (
    <div className="h-[calc(100vh-0px)] flex bg-muted/20">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, o escanear código de barras..."
              className="input-field pl-10 pr-10 h-11"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    handleBarcodeSearch(val);
                  }
                }
              }}
            />
            {searching ? (
              <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              <ScanLine size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
            )}
          </div>
        </div>

        {/* Left Side: Product Grid */}
        <div className="flex-1 overflow-y-auto mt-2 pr-2 scrollbar-thin">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {(searchQuery.length >= 2 ? searchResults : products).map(product => (
              <button
                key={product.id}
                onClick={() => { addToCart(product); setShowResults(false); setSearchQuery(''); }}
                className="flex flex-col p-4 rounded-2xl border bg-card hover:border-primary/50 transition-all text-left group"
              >
                <div className="w-full aspect-square rounded-xl bg-muted/30 mb-3 overflow-hidden flex items-center justify-center border border-transparent group-hover:border-primary/20">
                  {product.mainImageUrl ? (
                    <img src={product.mainImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package size={32} className="text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                  )}
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">{product.name}</h4>
                <div className="mt-auto pt-2 flex items-center justify-between w-full">
                  <p className="text-primary font-bold">{formatCurrency(product.salePrice)}</p>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium">Stock: {product.stock}</span>
                </div>
              </button>
            ))}
            {products.length === 0 && !searching && searchQuery.length < 2 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Package size={48} className="opacity-20 mb-3" />
                <p>No hay productos en el inventario</p>
              </div>
            )}
            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Search size={48} className="opacity-20 mb-3" />
                <p>No se encontraron productos para &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[420px] border-l bg-card flex flex-col shadow-2xl z-10 relative">
        {/* Customer Section */}
        <div className="p-4 border-b bg-muted/10 relative">
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustomerSearch(!showCustomerSearch)}
              className="btn-outline flex-1 justify-between h-11 px-4"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <User size={16} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{customer ? `${customer.firstName} ${customer.lastName || ''}` : 'Seleccionar Cliente...'}</span>
              </div>
              <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
            </button>
            <button onClick={() => setIsAddingCustomer(true)} title="Nuevo Cliente" className="btn-outline px-3 rounded-xl shrink-0 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors h-11">
              <Plus size={18} />
            </button>
          </div>
          
          {showCustomerSearch && !isAddingCustomer && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-card border rounded-2xl shadow-xl z-50 p-3 animate-in">
              <input
                type="text"
                placeholder="Buscar cliente por nombre o DNI..."
                className="input-field text-sm mb-2"
                value={customerQuery}
                onChange={e => searchCustomers(e.target.value)}
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                {customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCustomer(c); setShowCustomerSearch(false); setCustomerQuery(''); }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-muted text-sm transition-colors"
                  >
                    <p className="font-medium">{c.firstName} {c.lastName || ''}</p>
                    <p className="text-xs text-muted-foreground">{c.dni || c.phone || 'Sin documento'}</p>
                  </button>
                ))}
                {customers.length === 0 && customerQuery.length > 1 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin resultados</p>
                )}
              </div>
              {customer && (
                <button
                  onClick={() => { setCustomer(null); setShowCustomerSearch(false); }}
                  className="w-full text-center text-xs text-red-500 mt-2 pt-2 border-t font-medium hover:underline"
                >
                  Quitar cliente actual
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2 bg-muted/5">
          {cart.map(item => (
            <div key={item.productId} className="flex flex-col gap-2 p-3 rounded-2xl bg-card border shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-medium leading-tight">{item.productName}</p>
                <button onClick={() => removeFromCart(item.productId)} className="btn-ghost btn-icon btn-sm h-6 w-6 text-red-500 hover:bg-red-500/10 shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-md hover:bg-background transition-colors flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-md hover:bg-background transition-colors flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} c/u</p>
                  <p className="text-sm font-bold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <ShoppingCart size={40} className="text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">Carrito vacío</p>
              <p className="text-xs text-muted-foreground mt-1">Busque productos o escanee códigos</p>
            </div>
          )}
        </div>

        {/* Resumen & Pay */}
        <div className="p-4 bg-card border-t shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descuento</span>
                <span className="font-semibold text-red-500">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGV (18%)</span>
              <span className="font-semibold">{formatCurrency(igv)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t mt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="btn-primary w-full h-12 gap-2 text-base shadow-lg shadow-primary/25"
          >
            <DollarSign size={20} />
            Cobrar {formatCurrency(total)}
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={() => !processing && setShowPaymentModal(false)}>
          <div className="dialog-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Completar Pago</h3>
              <button onClick={() => { setShowPaymentModal(false); setPayments([]); }} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-primary mb-1">{formatCurrency(total)}</p>
              <p className="text-sm text-muted-foreground capitalize font-medium">
                Son: {formatCurrencyWords(total)}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {paymentMethods.map(method => {
                const payment = payments.find(p => p.method === method);
                return (
                  <div key={method} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                      {paymentIcons[method]}
                    </div>
                    <span className="flex-1 font-semibold">{translatePaymentMethod(method)}</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input-field w-28 text-right font-semibold"
                      value={payment?.amount || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPayments(prev => {
                          const filtered = prev.filter(p => p.method !== method);
                          return val > 0 ? [...filtered, { method: method as any, amount: val }] : filtered;
                        });
                      }}
                    />
                    {payment && (
                      <button
                        onClick={() => setPayments(prev => prev.filter(p => p.method !== method))}
                        className="btn-ghost btn-icon btn-sm text-red-500"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPayments > total && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">Vuelto a Entregar</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(totalPayments - total)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowPaymentModal(false); setPayments([]); }} className="btn-outline flex-1 h-11" disabled={processing}>
                Cancelar
              </button>
              <button onClick={handleCheckout} disabled={processing || payments.length === 0} className="btn-primary flex-1 h-11 gap-2">
                {processing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  `Pagar ${formatCurrency(total)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingCustomer && (
        <div className="dialog-overlay flex items-center justify-center z-[100]" onClick={() => !savingCustomer && setIsAddingCustomer(false)}>
          <div className="dialog-content max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Nuevo Cliente</h3>
              <button onClick={() => setIsAddingCustomer(false)} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">DNI / Documento *</label>
                <input className="input-field" value={newCustomerForm.dni} onChange={e => setNewCustomerForm({ ...newCustomerForm, dni: e.target.value })} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nombres *</label>
                  <input className="input-field" value={newCustomerForm.firstName} onChange={e => setNewCustomerForm({ ...newCustomerForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Apellidos</label>
                  <input className="input-field" value={newCustomerForm.lastName} onChange={e => setNewCustomerForm({ ...newCustomerForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Teléfono</label>
                  <input className="input-field" value={newCustomerForm.phone} onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="input-field" value={newCustomerForm.email} onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Dirección</label>
                <input className="input-field" value={newCustomerForm.address} onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setIsAddingCustomer(false)} className="btn-outline flex-1 h-11" disabled={savingCustomer}>Cancelar</button>
              <button onClick={handleSaveCustomer} disabled={savingCustomer} className="btn-primary flex-1 h-11 gap-2">
                {savingCustomer && <Loader2 size={18} className="animate-spin" />}
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
