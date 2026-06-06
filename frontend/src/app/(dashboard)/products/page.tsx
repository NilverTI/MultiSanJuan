'use client';

import { useEffect, useState } from 'react';
import { productsApi, categoriesApi, brandsApi } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, Plus, Package, Edit, Trash2, Barcode, Loader2, PackageSearch, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '', sku: '', categoryId: '', brandId: '', purchasePrice: '', salePrice: '', 
    stock: '', minStock: '5', unitType: 'UNIDAD', mainImageUrl: '', expirationDate: '', 
    description: '', barcodesArray: [] as string[]
  });
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const loadProducts = () => {
    setLoading(true);
    productsApi.getAll({ page, limit, search })
      .then((res: any) => { setProducts(res.data); setTotal(res.total); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll().catch(() => []),
      brandsApi.getAll().catch(() => [])
    ]).then(([cats, brds]) => {
      setCategories(cats);
      setBrands(brds);
    });
  }, []);

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      return;
    }
    try {
      const res = await categoriesApi.create({ name: newCategoryName.trim() });
      setCategories([...categories, res]);
      setFormData({ ...formData, categoryId: res.id });
      toast.success('Categoría agregada');
    } catch (err: any) { toast.error(err.message || 'Error al agregar categoría'); }
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      setIsAddingBrand(false);
      return;
    }
    try {
      const res = await brandsApi.create({ name: newBrandName.trim() });
      setBrands([...brands, res]);
      setFormData({ ...formData, brandId: res.id });
      toast.success('Marca agregada');
    } catch (err: any) { toast.error(err.message || 'Error al agregar marca'); }
    setIsAddingBrand(false);
    setNewBrandName('');
  };

  const addBarcode = () => {
    if (!barcodeInput.trim()) return;
    if (formData.barcodesArray.includes(barcodeInput.trim())) {
      return toast.error('El código ya fue agregado');
    }
    setFormData({ ...formData, barcodesArray: [...formData.barcodesArray, barcodeInput.trim()] });
    setBarcodeInput('');
  };

  const removeBarcode = (code: string) => {
    setFormData({ ...formData, barcodesArray: formData.barcodesArray.filter(b => b !== code) });
  };

  const handleEdit = (product: Product) => {
    const descParts = (product.description || '').split('Fecha de Vencimiento:');
    const description = descParts[0].trim();
    const expirationDate = descParts.length > 1 ? descParts[1].trim() : '';

    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: (product as any).categoryId || product.category?.id || '',
      brandId: (product as any).brandId || product.brand?.id || '',
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      unitType: product.unitType,
      mainImageUrl: product.mainImageUrl || '',
      expirationDate,
      description,
      barcodesArray: product.barcodes?.map(b => b.barcode) || []
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.salePrice || !formData.categoryId) {
      return toast.error('Por favor complete los campos obligatorios');
    }
    setSaving(true);
    try {
      const barcodes = formData.barcodesArray.map(b => ({ barcode: b }));

      const finalDescription = formData.expirationDate 
        ? `${formData.description}\nFecha de Vencimiento: ${formData.expirationDate}`.trim()
        : formData.description;

      const payload = {
        name: formData.name,
        sku: formData.sku,
        categoryId: formData.categoryId || undefined,
        brandId: formData.brandId || undefined,
        purchasePrice: Number(formData.purchasePrice) || 0,
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 0,
        maxStock: 9999, // default
        unitType: formData.unitType,
        description: finalDescription,
        mainImageUrl: formData.mainImageUrl,
        barcodes: barcodes.length > 0 ? barcodes : undefined
      };

      if (editingId) {
        const { sku, ...updatePayload } = payload;
        await productsApi.update(editingId, updatePayload);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productsApi.create(payload);
        toast.success('Producto creado exitosamente');
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({ 
        name: '', sku: '', categoryId: '', brandId: '', purchasePrice: '', salePrice: '', 
        stock: '', minStock: '5', unitType: 'UNIDAD', mainImageUrl: '', expirationDate: '', 
        description: '', barcodesArray: [] 
      });
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{total} productos registrados en inventario</p>
        </div>
        <button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', sku: '', categoryId: '', brandId: '', purchasePrice: '', salePrice: '', stock: '', minStock: '5', unitType: 'UNIDAD', mainImageUrl: '', expirationDate: '', description: '', barcodesArray: [] });
          setShowModal(true);
        }} className="btn-primary btn-sm gap-2">
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Producto</th>
                <th className="table-header-cell">SKU</th>
                <th className="table-header-cell">Categoría</th>
                <th className="table-header-cell">Precio Venta</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="table-row border-t">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center ring-1 ring-border overflow-hidden">
                        {product.mainImageUrl ? (
                          <img src={product.mainImageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={22} className="text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.brand && <p className="text-xs text-muted-foreground">{product.brand.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <code className="text-xs bg-muted px-2.5 py-1 rounded-lg font-mono">{product.sku}</code>
                  </td>
                  <td className="table-cell text-muted-foreground">{product.category?.name || '-'}</td>
                  <td className="table-cell font-semibold">{formatCurrency(product.salePrice)}</td>
                  <td className="table-cell">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 font-semibold',
                      product.stock <= product.minStock ? 'text-red-500' : 'text-emerald-500'
                    )}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= product.minStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      {product.stock}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={product.isActive ? 'badge-success' : 'badge-danger'}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(product)} className="btn-ghost btn-icon btn-sm"><Edit size={15} /></button>
                      <button className="btn-ghost btn-icon btn-sm text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <PackageSearch size={48} className="mx-auto mb-3 opacity-20" />
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Página {page} de {Math.ceil(total / limit)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline btn-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="btn-outline btn-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="dialog-content max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b bg-muted/10">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Basic Info */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Información Principal</h4>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nombre del producto *</label>
                    <input className="input-field" placeholder="Ej. Laptop HP Envy 13" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">SKU / Código Interno *</label>
                      <input className="input-field font-mono" placeholder="Ej. LPT-HP-13" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Unidad de Medida</label>
                      <select className="input-field" value={formData.unitType} onChange={e => setFormData({ ...formData, unitType: e.target.value })}>
                        <option value="UNIDAD">Unidad</option>
                        <option value="KG">Kilogramos (KG)</option>
                        <option value="LITRO">Litros (L)</option>
                        <option value="CAJA">Caja</option>
                        <option value="METRO">Metros (M)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Categoría *</label>
                      <div className="flex gap-2">
                        {isAddingCategory ? (
                          <>
                            <input 
                              autoFocus
                              className="input-field flex-1" 
                              placeholder="Nombre de categoría..." 
                              value={newCategoryName} 
                              onChange={e => setNewCategoryName(e.target.value)} 
                              onKeyDown={e => e.key === 'Enter' && handleSaveCategory()}
                            />
                            <button onClick={handleSaveCategory} title="Guardar" className="btn-outline px-3 rounded-xl shrink-0 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                              <Check size={18} />
                            </button>
                            <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} title="Cancelar" className="btn-outline px-3 rounded-xl shrink-0 text-red-500 border-red-500/20 hover:bg-red-500/10 transition-colors">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <select className="input-field flex-1" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                              <option value="">Seleccionar categoría...</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <button onClick={() => setIsAddingCategory(true)} title="Agregar Categoría" className="btn-outline px-3 rounded-xl shrink-0 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                              <Plus size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Marca</label>
                      <div className="flex gap-2">
                        {isAddingBrand ? (
                          <>
                            <input 
                              autoFocus
                              className="input-field flex-1" 
                              placeholder="Nombre de marca..." 
                              value={newBrandName} 
                              onChange={e => setNewBrandName(e.target.value)} 
                              onKeyDown={e => e.key === 'Enter' && handleSaveBrand()}
                            />
                            <button onClick={handleSaveBrand} title="Guardar" className="btn-outline px-3 rounded-xl shrink-0 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                              <Check size={18} />
                            </button>
                            <button onClick={() => { setIsAddingBrand(false); setNewBrandName(''); }} title="Cancelar" className="btn-outline px-3 rounded-xl shrink-0 text-red-500 border-red-500/20 hover:bg-red-500/10 transition-colors">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <select className="input-field flex-1" value={formData.brandId} onChange={e => setFormData({ ...formData, brandId: e.target.value })}>
                              <option value="">Ninguna o Sin marca</option>
                              {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                              ))}
                            </select>
                            <button onClick={() => setIsAddingBrand(true)} title="Agregar Marca" className="btn-outline px-3 rounded-xl shrink-0 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                              <Plus size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Descripción</label>
                    <textarea className="input-field min-h-[80px]" placeholder="Detalles adicionales del producto..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  {/* Additional Data (Moved to left col) */}
                  <div className="pt-4 border-t border-border/50 space-y-4">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Datos Adicionales</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Códigos de Barras</label>
                          <div className="flex gap-2">
                            <input className="input-field flex-1" placeholder="Ej: 775123456789" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addBarcode()} />
                            <button onClick={addBarcode} className="btn-outline px-3 rounded-xl shrink-0 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                              <Plus size={18} />
                            </button>
                          </div>
                          {formData.barcodesArray.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.barcodesArray.map(code => (
                                <span key={code} className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-mono border">
                                  {code}
                                  <button onClick={() => removeBarcode(code)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Fecha de Vencimiento</label>
                          <input type="date" className="input-field" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} />
                          <p className="text-[10px] text-muted-foreground">Opcional. Se guardará en la descripción.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">URL de Imagen</label>
                        <input type="url" className="input-field" placeholder="https://ejemplo.com/imagen.jpg" value={formData.mainImageUrl} onChange={e => setFormData({ ...formData, mainImageUrl: e.target.value })} />
                        {formData.mainImageUrl && (
                          <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                            <img src={formData.mainImageUrl} alt="Vista previa" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock (Right Col) */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Precios e Inventario</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Precio de Compra</label>
                      <input type="number" step="0.01" className="input-field" placeholder="0.00" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Precio de Venta *</label>
                      <input type="number" step="0.01" className="input-field" placeholder="0.00" value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: e.target.value })} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Stock Inicial</label>
                        <input type="number" className="input-field" placeholder="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Stock Mínimo</label>
                        <input type="number" className="input-field" placeholder="5" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 border-t bg-muted/20 flex gap-3 justify-end rounded-b-xl">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary gap-2 px-6">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? 'Guardar Cambios' : 'Registrar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
