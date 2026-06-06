'use client';

import { useEffect, useState } from 'react';
import { usersApi, rolesApi } from '@/services/api';
import { formatDate, getStatusColor, translateStatus } from '@/lib/utils';
import { toast } from 'sonner';
import { UserCircle, Plus, Search, ToggleLeft, Trash2, Loader2, X } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: '', dni: '', phone: '', roleIds: [] as string[] });

  const load = () => {
    setLoading(true);
    Promise.all([usersApi.getAll({ search }), rolesApi.getAll()])
      .then(([u, r]) => { setUsers(u.data || []); setRoles(r); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await usersApi.update(editUser.id, form);
        toast.success('Usuario actualizado');
      } else {
        await usersApi.create({ ...form, password: form.password || '123456' });
        toast.success('Usuario creado');
      }
      setShowModal(false);
      setEditUser(null);
      setForm({ firstName: '', lastName: '', email: '', username: '', password: '', dni: '', phone: '', roleIds: [] });
      load();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const toggleStatus = async (id: string) => {
    try { await usersApi.toggleStatus(id); toast.success('Estado cambiado'); load(); } catch (err: any) { toast.error(err.message); }
  };

  const openNew = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', username: '', password: '', dni: '', phone: '', roleIds: [] });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, username: u.username, password: '', dni: u.dni || '', phone: u.phone || '', roleIds: u.roles?.map((r: any) => r.roleId) || [] });
    setShowModal(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{users.length} usuarios registrados en el sistema</p>
        </div>
        <button onClick={openNew} className="btn-primary btn-sm gap-2">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Buscar usuarios..." />
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Usuario</th>
              <th className="table-header-cell">Email</th>
              <th className="table-header-cell">Roles</th>
              <th className="table-header-cell">Estado</th>
              <th className="table-header-cell">Creado</th>
              <th className="table-header-cell w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="table-row border-t">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                      <UserCircle size={22} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-muted-foreground">{u.email}</td>
                <td className="table-cell">
                  <div className="flex gap-1.5 flex-wrap">
                    {u.roles?.map((r: any) => <span key={r.role.id} className="badge-info">{r.role.name}</span>)}
                  </div>
                </td>
                <td className="table-cell"><span className={getStatusColor(u.status)}>{translateStatus(u.status)}</span></td>
                <td className="table-cell text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(u.id)} className="btn-ghost btn-icon btn-sm" title="Cambiar estado">
                      <ToggleLeft size={15} />
                    </button>
                    <button onClick={() => openEdit(u)} className="btn-ghost btn-icon btn-sm" title="Editar">
                      <Trash2 size={15} className="rotate-90" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <UserCircle size={48} className="mx-auto mb-3 opacity-20" />
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="dialog-overlay flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="dialog-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn-icon btn-sm"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input className="input-field" placeholder="Nombres" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
              <input className="input-field" placeholder="Apellidos" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              <input className="input-field" placeholder="Usuario" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
              {!editUser && <input className="input-field" type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />}
              <input className="input-field" placeholder="DNI" value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} />
              <input className="input-field" placeholder="Celular" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="mb-6">
              <label className="text-sm font-medium mb-2.5 block">Roles</label>
              <div className="flex gap-2 flex-wrap">
                {roles.map((r: any) => (
                  <button key={r.id} onClick={() => setForm(p => ({ ...p, roleIds: p.roleIds.includes(r.id) ? p.roleIds.filter(id => id !== r.id) : [...p.roleIds, r.id] }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.roleIds.includes(r.id) ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card border-border hover:border-primary/30'}`}>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editUser ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
