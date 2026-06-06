'use client';

import { useEffect, useState } from 'react';
import { rolesApi, permissionsApi } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Shield, Plus, Search, Trash2, Loader2, X, CheckSquare, Square } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] as string[] });

  const load = () => {
    setLoading(true);
    Promise.all([rolesApi.getAll(), permissionsApi.getAll()])
      .then(([r, p]) => {
        setRoles(r || []);
        setPermissions(p || []);
      })
      .catch((err) => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return toast.error('El nombre del rol es requerido');
    }
    
    setSaving(true);
    try {
      if (editRole) {
        await rolesApi.update(editRole.id, form);
        toast.success('Rol actualizado');
      } else {
        await rolesApi.create(form);
        toast.success('Rol creado');
      }
      setShowModal(false);
      setEditRole(null);
      setForm({ name: '', description: '', permissionIds: [] });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditRole(null);
    setForm({ name: '', description: '', permissionIds: [] });
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setEditRole(r);
    setForm({
      name: r.name,
      description: r.description || '',
      permissionIds: r.permissions?.map((p: any) => p.permissionId) || []
    });
    setShowModal(true);
  };

  const removeRole = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        await rolesApi.delete(id);
        toast.success('Rol eliminado');
        load();
      } catch (err: any) {
        toast.error(err.message || 'Error al eliminar');
      }
    }
  };

  const togglePermission = (permId: string) => {
    setForm(p => ({
      ...p,
      permissionIds: p.permissionIds.includes(permId)
        ? p.permissionIds.filter(id => id !== permId)
        : [...p.permissionIds, permId]
    }));
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const toggleModulePermissions = (module: string) => {
    const modulePerms = permissionsByModule[module].map((p: any) => p.id);
    const allSelected = modulePerms.every((id: string) => form.permissionIds.includes(id));
    
    setForm(p => {
      let newIds = [...p.permissionIds];
      if (allSelected) {
        newIds = newIds.filter(id => !modulePerms.includes(id));
      } else {
        modulePerms.forEach((id: string) => {
          if (!newIds.includes(id)) newIds.push(id);
        });
      }
      return { ...p, permissionIds: newIds };
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles y Permisos</h1>
          <p className="page-subtitle">Gestiona los roles de los usuarios y sus permisos en el sistema</p>
        </div>
        <button onClick={openNew} className="btn-primary btn-sm gap-2">
          <Plus size={16} /> Nuevo Rol
        </button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Buscar roles..." />
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Rol</th>
              <th className="table-header-cell">Descripción</th>
              <th className="table-header-cell">Permisos</th>
              <th className="table-header-cell">Tipo</th>
              <th className="table-header-cell">Creado</th>
              <th className="table-header-cell w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((r: any) => (
              <tr key={r.id} className="table-row border-t">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center ring-1 ring-indigo-500/10">
                      <Shield size={22} className="text-indigo-500" />
                    </div>
                    <p className="font-medium">{r.name}</p>
                  </div>
                </td>
                <td className="table-cell text-muted-foreground">{r.description || '-'}</td>
                <td className="table-cell">
                  <span className="badge-info">{r.permissions?.length || 0} permisos</span>
                </td>
                <td className="table-cell">
                  {r.isSystem ? <span className="badge bg-red-100 text-red-700 border-red-200">Sistema</span> : <span className="badge bg-green-100 text-green-700 border-green-200">Personalizado</span>}
                </td>
                <td className="table-cell text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="btn-ghost btn-icon btn-sm" title="Editar">
                      <Shield size={15} />
                    </button>
                    {!r.isSystem && (
                      <button onClick={() => removeRole(r.id)} className="btn-ghost btn-icon btn-sm text-red-500 hover:text-red-600 hover:bg-red-50" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRoles.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Shield size={48} className="mx-auto mb-3 opacity-20" />
                  No se encontraron roles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="dialog-content max-w-4xl w-[90vw] h-[85vh] flex flex-col p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{editRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nombre del Rol *</label>
                  <input className="input-field" placeholder="Ej. Administrador" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={editRole?.isSystem} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Descripción</label>
                  <input className="input-field" placeholder="Breve descripción del rol" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2"><Shield size={18} className="text-primary" /> Permisos del Rol</h4>
                  <span className="text-sm text-muted-foreground">{form.permissionIds.length} seleccionados de {permissions.length}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(permissionsByModule).map(([module, perms]: [string, any]) => {
                    const modulePerms = perms.map((p: any) => p.id);
                    const allSelected = modulePerms.every((id: string) => form.permissionIds.includes(id));
                    const someSelected = modulePerms.some((id: string) => form.permissionIds.includes(id));

                    return (
                      <div key={module} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        <div 
                          className="bg-muted/50 p-3 border-b flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => toggleModulePermissions(module)}
                        >
                          <span className="font-semibold text-sm capitalize">{module.toLowerCase().replace(/_/g, ' ')}</span>
                          {allSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className={someSelected ? "text-primary opacity-50 fill-primary/20" : "text-muted-foreground"} />}
                        </div>
                        <div className="p-3 space-y-2">
                          {perms.map((perm: any) => (
                            <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                              <div className="mt-0.5">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={form.permissionIds.includes(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">{perm.description || perm.name}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{perm.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-muted/20 flex gap-3 justify-end rounded-b-xl">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary gap-2 px-6">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editRole ? 'Guardar Cambios' : 'Crear Rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
