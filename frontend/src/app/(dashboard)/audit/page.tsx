'use client';

import { useEffect, useState } from 'react';
import { auditApi } from '@/services/api';
import { formatDate, getStatusColor, translateStatus } from '@/lib/utils';
import { Shield, Search, Filter, Loader2, ScrollText } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ module: '', action: '' });

  useEffect(() => {
    setLoading(true);
    auditApi.getAll({ page, limit: 50, ...filters }).then((res: any) => setLogs(res.data || [])).finally(() => setLoading(false));
  }, [page, filters]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoría</h1>
          <p className="page-subtitle">Registro de todas las acciones del sistema</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filters.module} onChange={e => setFilters(p => ({ ...p, module: e.target.value }))} className="input-field w-44">
          <option value="">Todos los módulos</option>
          <option value="USERS">Usuarios</option>
          <option value="PRODUCTS">Productos</option>
          <option value="SALES">Ventas</option>
          <option value="CASH_REGISTER">Caja</option>
        </select>
        <select value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} className="input-field w-44">
          <option value="">Todas las acciones</option>
          <option value="LOGIN">Inicio Sesión</option>
          <option value="LOGOUT">Cierre Sesión</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
          <option value="SALE_CREATED">Venta Creada</option>
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Usuario</th>
                <th className="table-header-cell">Acción</th>
                <th className="table-header-cell">Módulo</th>
                <th className="table-header-cell">Descripción</th>
                <th className="table-header-cell">IP</th>
                <th className="table-header-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="table-row border-t">
                  <td className="table-cell">{log.user ? `${log.user.firstName} ${log.user.lastName}` : '-'}</td>
                  <td className="table-cell"><span className={getStatusColor(log.action)}>{translateStatus(log.action)}</span></td>
                  <td className="table-cell text-muted-foreground">{translateStatus(log.module)}</td>
                  <td className="table-cell text-sm max-w-xs truncate">{log.description}</td>
                  <td className="table-cell text-xs text-muted-foreground font-mono">{log.ipAddress || '-'}</td>
                  <td className="table-cell text-xs text-muted-foreground">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <ScrollText size={48} className="mx-auto mb-3 opacity-20" />
                    No hay registros de auditoría
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
