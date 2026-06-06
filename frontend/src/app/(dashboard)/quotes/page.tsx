'use client';

import { useEffect, useState } from 'react';
import { quotesApi } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor, translateStatus } from '@/lib/utils';
import { FileText, Plus, Search, Loader2, ScrollText } from 'lucide-react';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    quotesApi.getAll({ page, limit: 20 }).then((res: any) => setQuotes(res.data || [])).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cotizaciones</h1>
          <p className="page-subtitle">{quotes.length} cotizaciones registradas</p>
        </div>
        <button className="btn-primary btn-sm gap-2"><Plus size={16} /> Nueva Cotización</button>
      </div>
      {loading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">N° Cotización</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Válido Hasta</th>
                <th className="table-header-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} className="table-row border-t">
                  <td className="table-cell font-medium">{q.quoteNumber}</td>
                  <td className="table-cell">{q.customer ? `${q.customer.firstName} ${q.customer.lastName || ''}` : <span className="text-muted-foreground">Sin cliente</span>}</td>
                  <td className="table-cell font-bold">{formatCurrency(q.total)}</td>
                  <td className="table-cell"><span className={getStatusColor(q.status)}>{translateStatus(q.status)}</span></td>
                  <td className="table-cell text-sm">{q.validUntil ? formatDate(q.validUntil) : '-'}</td>
                  <td className="table-cell text-xs text-muted-foreground">{formatDate(q.createdAt)}</td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <ScrollText size={48} className="mx-auto mb-3 opacity-20" />
                    No hay cotizaciones registradas
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
