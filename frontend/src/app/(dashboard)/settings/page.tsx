'use client';

import { useEffect, useState } from 'react';
import { settingsApi } from '@/services/api';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.getAll().then((data: any) => {
      setSettings(data);
      const v: Record<string, string> = {};
      data.forEach((s: any) => { v[s.key] = s.value; });
      setValues(v);
    }).catch(err => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try { await settingsApi.update(key, values[key]); toast.success('Configuración guardada'); } catch (err: any) { toast.error(err.message); } finally { setSavingKey(null); }
  };

  const groups = settings.reduce((acc: any, s: any) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {} as Record<string, any[]>);

  const groupLabels: Record<string, string> = {
    business: 'Negocio',
    tax: 'Impuestos',
    printing: 'Impresión',
    appearance: 'Apariencia',
  };

  if (loading) return <div className="page-container"><div className="space-y-6">{[...Array(3)].map((_, i) => (<div key={i} className="skeleton h-48 rounded-2xl" />))}</div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes y preferencias del sistema</p>
        </div>
      </div>
      <div className="space-y-6">
        {Object.entries(groups).map(([group, items]: [string, any]) => (
          <div key={group} className="card-modern p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
              <SettingsIcon size={20} className="text-primary" />
              {groupLabels[group] || group}
            </h3>
            <div className="space-y-4">
              {items.map((setting: any) => (
                <div key={setting.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <label className="text-sm w-44 font-medium text-muted-foreground capitalize">{setting.key.replace(/_/g, ' ')}</label>
                  <input
                    type={setting.type === 'boolean' ? 'checkbox' : setting.type === 'number' ? 'number' : 'text'}
                    value={values[setting.key] || ''}
                    checked={setting.type === 'boolean' ? values[setting.key] === 'true' : undefined}
                    onChange={e => setValues(prev => ({ ...prev, [setting.key]: setting.type === 'boolean' ? (e.target.checked ? 'true' : 'false') : e.target.value }))}
                    className={setting.type === 'boolean' ? 'w-5 h-5 rounded-md accent-primary cursor-pointer' : 'input-field flex-1'}
                  />
                  <button onClick={() => handleSave(setting.key)} className="btn-primary btn-icon btn-sm" disabled={savingKey === setting.key}>
                    {savingKey === setting.key ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
