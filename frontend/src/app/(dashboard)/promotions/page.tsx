'use client';

import { useEffect, useState } from 'react';
import { promotionsApi } from '@/services/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Tag, Plus, Trash2, Loader2, Gift, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PRODUCT',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  const load = () => { setLoading(true); promotionsApi.getAll().then(setPromotions).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!formData.name) return toast.error('El nombre es requerido');
    
    setSaving(true);
    try {
      if (editingId) {
        await promotionsApi.update(editingId, formData);
        toast.success('Promoción actualizada');
      } else {
        await promotionsApi.create(formData);
        toast.success('Promoción creada');
      }
      handleCloseModal();
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      await promotionsApi.delete(id);
      toast.success('Promoción eliminada');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const handleEdit = (promo: any) => {
    setEditingId(promo.id);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate.split('T')[0],
      isActive: promo.isActive
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      type: 'PRODUCT',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Promociones</h1>
          <p className="page-subtitle">{promotions.length} promociones registradas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-2">
          <Plus size={16} /> Nueva Promoción
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (<div key={i} className="skeleton h-40 rounded-2xl" />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map(promo => (
            <div key={promo.id} className="card-modern p-5 group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center ring-1 ring-amber-500/10">
                    <Gift size={22} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{promo.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      {promo.type} &middot; {promo.discountType}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={getStatusColor(promo.isActive ? 'ACTIVE' : 'INACTIVE')}>
                    {promo.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm space-y-1.5 p-3 rounded-xl bg-muted/30 mb-4 border border-border/50">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  Beneficio: {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% de desc.` : `S/ ${promo.discountValue} de desc.`}
                </p>
                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground italic">
                  <p>Inicia: {formatDate(promo.startDate)}</p>
                  <p>Termina: {formatDate(promo.endDate)}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleEdit(promo)} className="btn-ghost btn-icon btn-sm text-blue-500">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(promo.id)} className="btn-ghost btn-icon btn-sm text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {promotions.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed">
              <Gift size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay promociones registradas</p>
              <p className="text-sm opacity-60">Crea una nueva promoción para empezar</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={handleCloseModal}>
          <div className="dialog-content max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={handleCloseModal} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Nombre de la Promoción *</label>
                <input className="input-field" placeholder="Ej: Black Friday, Descuento Navidad" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo de Aplicación</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="PRODUCT">Producto Específico</option>
                  <option value="CATEGORY">Toda una Categoría</option>
                  <option value="QUANTITY">Por Cantidad</option>
                  <option value="DATE">Por Rango de Fecha</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo de Descuento</label>
                <select className="input-field" value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto Fijo (S/)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Valor del Descuento</label>
                <input type="number" className="input-field" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estado</label>
                <select className="input-field" value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <input type="date" className="input-field" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha Fin</label>
                <input type="date" className="input-field" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-8">
              <button onClick={handleCloseModal} className="btn-outline">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || !formData.name} className="btn-primary gap-2 min-w-[140px]">
                {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? 'Guardar Cambios' : 'Crear Promoción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
