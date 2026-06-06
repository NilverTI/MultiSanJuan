'use client';

import { useEffect, useState } from 'react';
import { salesApi } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor, translateStatus } from '@/lib/utils';
import { Search, Receipt, Eye, XCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Sale } from '@/types';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadSales = () => {
    setLoading(true);
    salesApi.getAll({ page, limit: 20 })
      .then((res: any) => { setSales(res.data); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSales(); }, [page]);

  const handleCancel = async (id: string) => {
    if (!confirm('¿Anular esta venta? Se devolverá el stock.')) return;
    try {
      await salesApi.cancel(id);
      toast.success('Venta anulada correctamente');
      loadSales();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">{total} ventas registradas en total</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Comprobante</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Vendedor</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Fecha</th>
                <th className="table-header-cell w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} className="table-row border-t">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="font-medium">{sale.receiptNumber}</span>
                    </div>
                  </td>
                  <td className="table-cell">{sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName || ''}` : <span className="text-muted-foreground">Sin cliente</span>}</td>
                  <td className="table-cell text-muted-foreground">{sale.user?.firstName} {sale.user?.lastName}</td>
                  <td className="table-cell font-bold">{formatCurrency(sale.total)}</td>
                  <td className="table-cell"><span className={getStatusColor(sale.status)}>{translateStatus(sale.status)}</span></td>
                  <td className="table-cell text-xs text-muted-foreground">{formatDate(sale.createdAt)}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-icon btn-sm" title="Ver detalle"><Eye size={15} /></button>
                      {sale.status === 'COMPLETED' && (
                        <button onClick={() => handleCancel(sale.id)} className="btn-ghost btn-icon btn-sm text-red-500 hover:text-red-400" title="Anular venta">
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Receipt size={48} className="mx-auto mb-3 opacity-20" />
                    No hay ventas registradas
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
