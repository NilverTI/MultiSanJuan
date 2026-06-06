'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { config } from '@/config';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Store, User } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-panel-wrap" aria-label="Inicio de sesión">
      <div className="login-panel">
        <div className="panel-head">
          <p className="welcome">Bienvenido de vuelta</p>
          <div className="panel-line" />
          <div className="panel-logo">
            <Store size={40} />
          </div>
          <h2 className="panel-title">
            MULTI <span>SAN</span> <strong>JUAN</strong>
          </h2>
          <p className="panel-subtitle">{config.appDescription}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}

          <label>
            <span className="field-label">Usuario o email</span>
            <span className="input-shell">
              <User aria-hidden="true" />
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                autoFocus
                autoComplete="username"
              />
            </span>
          </label>

          <label>
            <span className="field-label">Contraseña</span>
            <span className="input-shell">
              <Lock aria-hidden="true" />
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                autoComplete="current-password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spinner" size={19} />
                Iniciando sesión
              </>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="panel-status">
          <span className="status-left">
            <span className="status-dot" />
            Sistema activo
          </span>
          <span>Versión {config.version}</span>
        </div>
      </div>
    </section>
  );
}
