'use client';

import { useEffect, useState } from 'react';
import { inventoryApi } from '@/services/api';
import { formatDate, translateInventoryMovementType } from '@/lib/utils';
import { ArrowDownUp, Loader2, Boxes } from 'lucide-react';

export default function InventoryPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    inventoryApi.getMovements({ page, limit: 30 }).then((res: any) => setMovements(res.data || [])).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Movimientos de Inventario</h1>
          <p className="page-subtitle">Historial de entradas, salidas y ajustes</p>
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Producto</th>
                <th className="table-header-cell">Tipo</th>
                <th className="table-header-cell">Cantidad</th>
                <th className="table-header-cell">Stock Anterior</th>
                <th className="table-header-cell">Stock Nuevo</th>
                <th className="table-header-cell">Usuario</th>
                <th className="table-header-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m: any) => (
                <tr key={m.id} className="table-row border-t">
                  <td className="table-cell font-medium">{m.product?.name || m.productId}</td>
                  <td className="table-cell">
                    <span className={`badge ${m.type === 'ENTRY' || m.type === 'RETURN' ? 'badge-success' : m.type === 'SALE' ? 'badge-warning' : 'badge-danger'}`}>
                      {translateInventoryMovementType(m.type)}
                    </span>
                  </td>
                  <td className="table-cell font-semibold">{m.quantity}</td>
                  <td className="table-cell text-muted-foreground">{m.stockBefore}</td>
                  <td className="table-cell font-medium">{m.stockAfter}</td>
                  <td className="table-cell text-muted-foreground">{m.user?.firstName} {m.user?.lastName}</td>
                  <td className="table-cell text-xs text-muted-foreground">{formatDate(m.createdAt)}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Boxes size={48} className="mx-auto mb-3 opacity-20" />
                    No hay movimientos registrados
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
