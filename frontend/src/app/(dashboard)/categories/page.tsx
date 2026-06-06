'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Tags, Trash2, Loader2, X, Edit } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); categoriesApi.getAll().then(setCategories).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try { 
      if (editingId) {
        await categoriesApi.update(editingId, { name, description });
        toast.success('Categoría actualizada');
      } else {
        await categoriesApi.create({ name, description });
        toast.success('Categoría creada');
      }
      setShowModal(false);
      setName('');
      setDescription('');
      setEditingId(null);
      load();
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try { await categoriesApi.delete(id); toast.success('Categoría eliminada'); load(); } catch (err: any) { toast.error(err.message); }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setName('');
    setDescription('');
    setEditingId(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">{categories.length} categorías de productos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-2"><Plus size={16} /> Nueva Categoría</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (<div key={i} className="skeleton h-20 rounded-2xl" />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="card-modern p-5 flex items-center justify-between group relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                  <Tags size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat._count?.products || 0} productos</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleEdit(cat)} className="btn-ghost btn-icon btn-sm text-blue-500 hover:text-blue-400">
                  <Edit size={15} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="btn-ghost btn-icon btn-sm text-red-500 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Tags size={48} className="mx-auto mb-3 opacity-20" />
              No hay categorías registradas
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={handleCloseModal}>
          <div className="dialog-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={handleCloseModal} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre *</label>
                <input className="input-field" placeholder="Ej: Abarrotes" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descripción</label>
                <input className="input-field" placeholder="Opcional..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-8">
              <button onClick={handleCloseModal} className="btn-outline">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || !name} className="btn-primary gap-2 min-w-[120px]">
                {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
