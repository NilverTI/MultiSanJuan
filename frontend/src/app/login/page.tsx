import { config } from '@/config';
import { BarChart3, Package, Receipt, ShieldCheck, ShoppingCart, Store, Wrench } from 'lucide-react';
import { LoginForm } from './login-form';

const modules = [
  { label: 'Inventario', detail: 'Stock y productos', icon: Package },
  { label: 'Ventas', detail: 'Atención rápida', icon: ShoppingCart },
  { label: 'Caja', detail: 'Movimientos claros', icon: Receipt },
  { label: 'Reportes', detail: 'Indicadores del día', icon: BarChart3 },
];

export default function LoginPage() {
  return (
    <main className="msj-login">
      <div className="msj-grid" />
      <div className="msj-beam one" />
      <div className="msj-beam two" />

      <section className="msj-shell">
        <aside className="hero-side" aria-hidden="true">
          <div className="brand-lockup">
            <div className="brand-mark">
              <Store size={32} />
            </div>
            <div>
              <p className="brand-name">
                MULTI <span>SAN</span> <strong>JUAN</strong>
              </p>
              <p className="brand-caption">{config.appDescription}</p>
            </div>
          </div>

          <h1 className="hero-title">
            Todo tu negocio,
            <span>en un solo sistema</span>
          </h1>
          <div className="hero-line" />
          <p className="hero-copy">
            Controla inventario, ventas, caja y reportes desde una plataforma integrada,
            segura y lista para el ritmo diario del negocio.
          </p>

          <div className="module-grid">
            {modules.map(({ label, detail, icon: Icon }) => (
              <div className="module-card" key={label}>
                <Icon />
                <p className="module-label">{label}</p>
                <p className="module-detail">{detail}</p>
              </div>
            ))}
          </div>

          <div className="visual-zone">
            <div className="storefront">
              <div className="store-sign">MULTI SAN JUAN</div>
              <div className="shelves">
                <span className="shelf" />
                <span className="shelf" />
                <span className="shelf" />
                <span className="shelf" />
                <span className="shelf" />
              </div>
              <div className="counter" />
            </div>
            <div className="product-stage" />
            <div className="tool-drill">
              <Wrench size={30} />
            </div>
            <div className="phone-item" />
          </div>

          <div className="bank-strip">
            <div><Package size={22} /> Inventario</div>
            <div><ShoppingCart size={22} /> Ventas</div>
            <div><Receipt size={22} /> Caja</div>
            <div><ShieldCheck size={22} /> Seguridad</div>
          </div>
        </aside>

        <LoginForm />
      </section>
    </main>
  );
}
