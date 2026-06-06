'use client';

import { useEffect, useState } from 'react';
import { customersApi } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, UserPlus, Users, Loader2 } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    customersApi.getAll({ search }).then((res: any) => setCustomers(res.data || [])).catch(err => toast.error(err.message)).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{customers.length} clientes registrados</p>
        </div>
        <button className="btn-primary btn-sm gap-2"><UserPlus size={16} /> Nuevo Cliente</button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Buscar por DNI, nombre o celular..." />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (<div key={i} className="skeleton h-28 rounded-2xl" />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <div key={c.id} className="card-modern p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                  <Users size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">{c.firstName} {c.lastName || ''}</p>
                  <p className="text-xs text-muted-foreground">{c.dni || 'Sin DNI'}</p>
                </div>
              </div>
              {c.phone && <p className="text-sm text-muted-foreground flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted-foreground/30" />{c.phone}</p>}
              {c.email && <p className="text-sm text-muted-foreground flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted-foreground/30" />{c.email}</p>}
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">Registrado: {formatDate(c.createdAt)}</p>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              No se encontraron clientes
            </div>
          )}
        </div>
      )}
    </div>
  );
}
