'use client';

import { useEffect, useState } from 'react';
import { saleNotesApi } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor, translateStatus } from '@/lib/utils';
import { ClipboardList, Plus, Loader2, FileText } from 'lucide-react';

export default function SaleNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    saleNotesApi.getAll({ page, limit: 20 }).then((res: any) => setNotes(res.data || [])).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas de Venta</h1>
          <p className="page-subtitle">{notes.length} notas registradas</p>
        </div>
        <button className="btn-primary btn-sm gap-2"><Plus size={16} /> Nueva Nota</button>
      </div>
      {loading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">N° Nota</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id} className="table-row border-t">
                  <td className="table-cell font-medium">{n.noteNumber}</td>
                  <td className="table-cell">{n.customer ? `${n.customer.firstName} ${n.customer.lastName || ''}` : <span className="text-muted-foreground">Sin cliente</span>}</td>
                  <td className="table-cell font-bold">{formatCurrency(n.total)}</td>
                  <td className="table-cell"><span className={getStatusColor(n.status)}>{translateStatus(n.status)}</span></td>
                  <td className="table-cell text-xs text-muted-foreground">{formatDate(n.createdAt)}</td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                    No hay notas de venta registradas
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
