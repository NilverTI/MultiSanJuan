'use client';

import { useEffect, useState } from 'react';
import { brandsApi } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Tag, Plus, Search, Edit, Trash2, Loader2, X, ToggleLeft } from 'lucide-react';

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', logoUrl: '', isActive: true });

  const load = () => {
    setLoading(true);
    brandsApi.getAll()
      .then((data) => setBrands(data || []))
      .catch((err) => toast.error('Error al cargar marcas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return toast.error('El nombre de la marca es requerido');
    }
    
    setSaving(true);
    try {
      if (editBrand) {
        await brandsApi.update(editBrand.id, form);
        toast.success('Marca actualizada');
      } else {
        await brandsApi.create(form);
        toast.success('Marca creada');
      }
      setShowModal(false);
      setEditBrand(null);
      setForm({ name: '', logoUrl: '', isActive: true });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la marca');
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditBrand(null);
    setForm({ name: '', logoUrl: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (b: any) => {
    setEditBrand(b);
    setForm({
      name: b.name,
      logoUrl: b.logoUrl || '',
      isActive: b.isActive
    });
    setShowModal(true);
  };

  const removeBrand = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta marca?')) {
      try {
        await brandsApi.delete(id);
        toast.success('Marca eliminada');
        load();
      } catch (err: any) {
        toast.error(err.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marcas</h1>
          <p className="page-subtitle">Gestiona las marcas de tus productos</p>
        </div>
        <button onClick={openNew} className="btn-primary btn-sm gap-2">
          <Plus size={16} /> Nueva Marca
        </button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Buscar marcas..." />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (<div key={i} className="skeleton h-24 rounded-2xl" />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((b: any) => (
            <div key={b.id} className="card-modern p-5 flex items-center justify-between group relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10 overflow-hidden shrink-0">
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    <Tag size={24} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{b.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      {b.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEdit(b)} className="btn-ghost btn-icon btn-sm text-blue-500 hover:text-blue-400">
                  <Edit size={16} />
                </button>
                <button onClick={() => removeBrand(b.id)} className="btn-ghost btn-icon btn-sm text-red-500 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredBrands.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed">
              <Tag size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron marcas</p>
              <p className="text-sm opacity-60">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="dialog-content max-w-md w-full flex flex-col p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{editBrand ? 'Editar Marca' : 'Nueva Marca'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre de la Marca *</label>
                <input className="input-field" placeholder="Ej. Nike, Samsung" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">URL del Logo (Opcional)</label>
                <input type="url" className="input-field" placeholder="https://ejemplo.com/logo.png" value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))} />
                {form.logoUrl && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border bg-muted/30 flex items-center justify-center">
                    <img src={form.logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.isActive}
                  onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
                />
                <span className="text-sm font-medium">Marca Activa</span>
              </label>
            </div>

            <div className="p-4 border-t bg-muted/20 flex gap-3 justify-end rounded-b-xl">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary gap-2 px-6">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editBrand ? 'Guardar Cambios' : 'Crear Marca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
