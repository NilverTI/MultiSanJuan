'use client';

import { useEffect, useState } from 'react';
import { cashRegisterApi } from '@/services/api';
import { formatCurrency, formatDate, translatePaymentMethod } from '@/lib/utils';
import { toast } from 'sonner';
import { DollarSign, Circle, Square, History, Loader2, X } from 'lucide-react';

export default function CashRegisterPage() {
  const [current, setCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialAmount, setInitialAmount] = useState('200');
  const [closeData, setCloseData] = useState({ countedCash: '', countedYape: '', countedPlin: '', countedTransfer: '', countedCard: '', observations: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    cashRegisterApi.current()
      .then(setCurrent)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    setSaving(true);
    try {
      await cashRegisterApi.open({ initialAmount: parseFloat(initialAmount) });
      toast.success('Caja abierta correctamente');
      load();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleClose = async () => {
    setSaving(true);
    try {
      await cashRegisterApi.close({
        countedCash: parseFloat(closeData.countedCash) || 0,
        countedYape: parseFloat(closeData.countedYape) || 0,
        countedPlin: parseFloat(closeData.countedPlin) || 0,
        countedTransfer: parseFloat(closeData.countedTransfer) || 0,
        countedCard: parseFloat(closeData.countedCard) || 0,
        observations: closeData.observations,
      });
      toast.success('Caja cerrada correctamente');
      load();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const loadHistory = async () => {
    const res = await cashRegisterApi.history({ page: 1, limit: 50 });
    setHistory(res.data || []);
    setShowHistory(!showHistory);
  };

  if (loading) return <div className="page-container"><div className="skeleton h-80 rounded-2xl" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caja</h1>
          <p className="page-subtitle">Gestión de caja registradora</p>
        </div>
        <button onClick={loadHistory} className="btn-outline btn-sm gap-2">
          <History size={16} /> {showHistory ? 'Ocultar Historial' : 'Historial'}
        </button>
      </div>

      {!current?.register ? (
        <div className="card-modern p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/10">
              <DollarSign size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Abrir Caja</h2>
            <p className="text-sm text-muted-foreground mt-1">Ingrese el monto inicial para comenzar</p>
          </div>
          <div className="space-y-4">
            <input type="number" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} className="input-field text-center text-2xl font-bold h-14" placeholder="0.00" />
            <button onClick={handleOpen} disabled={saving || !initialAmount} className="btn-primary w-full h-12 gap-2 text-base">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Circle size={18} className="text-green-400" />}
              Abrir Caja
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Caja Abierta</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold">Abierta</span>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30"><span className="text-muted-foreground">Monto Inicial</span><span className="font-semibold">{formatCurrency(current.register.initialAmount)}</span></div>
              <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30"><span className="text-muted-foreground">Ventas</span><span className="font-semibold">{current.totals?.totalSales || 0}</span></div>
              <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30"><span className="text-muted-foreground">Total Ventas</span><span className="font-semibold text-primary">{formatCurrency(current.totals?.totalAmount || 0)}</span></div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-base p-3 rounded-xl bg-primary/5"><span className="font-bold">Total Esperado</span><span className="font-bold text-primary">{formatCurrency(Number(current.register.initialAmount || 0) + Number(current.totals?.totalAmount || 0))}</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ventas por Método</p>
              {Object.entries(current.totals?.byMethod || {}).map(([method, amount]: [string, any]) => (
                <div key={method} className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                  <span className="font-medium">{translatePaymentMethod(method)}</span>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-modern p-6">
            <h3 className="font-bold text-lg mb-6">Cerrar Caja</h3>
            <div className="space-y-3">
              {['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'].map(method => (
                <div key={method}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{translatePaymentMethod(method)} Contado</label>
                  <input
                    type="number" step="0.01"
                    value={(closeData as any)[`counted${method.charAt(0) + method.slice(1).toLowerCase()}`] || ''}
                    onChange={e => setCloseData(prev => ({ ...prev, [`counted${method.charAt(0) + method.slice(1).toLowerCase()}`]: e.target.value }))}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              ))}
              <input
                type="text" placeholder="Observaciones (opcional)"
                value={closeData.observations}
                onChange={e => setCloseData(prev => ({ ...prev, observations: e.target.value }))}
                className="input-field"
              />
              <button onClick={handleClose} disabled={saving} className="btn-primary w-full h-11 gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Square size={18} />}
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="mt-6 animate-in">
          <h3 className="font-bold text-lg mb-4">Historial de Cierres</h3>
          <div className="table-container">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Abrió</th>
                  <th className="table-header-cell">Cerró</th>
                  <th className="table-header-cell">Esperado</th>
                  <th className="table-header-cell">Contado</th>
                  <th className="table-header-cell">Diferencia</th>
                  <th className="table-header-cell">Ventas</th>
                </tr>
              </thead>
              <tbody>
                {history.map((reg: any) => (
                  <tr key={reg.id} className="table-row border-t">
                    <td className="table-cell text-xs">{formatDate(reg.createdAt)}</td>
                    <td className="table-cell">{reg.openedBy?.firstName} {reg.openedBy?.lastName}</td>
                    <td className="table-cell">{reg.closedBy?.firstName} {reg.closedBy?.lastName || '-'}</td>
                    <td className="table-cell">{formatCurrency(reg.expectedTotal)}</td>
                    <td className="table-cell">{formatCurrency(reg.countedTotal)}</td>
                    <td className={`table-cell font-semibold ${reg.difference < 0 ? 'text-red-500' : reg.difference > 0 ? 'text-emerald-500' : ''}`}>
                      {formatCurrency(reg.difference)}
                    </td>
                    <td className="table-cell">{reg._count?.sales || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
