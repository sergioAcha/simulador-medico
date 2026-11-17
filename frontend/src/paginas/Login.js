import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setUsuario }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      setCargando(false);

      if (data.estado === 'ok') {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        setUsuario(data.usuario);
        const rol = data.usuario.rol;
        if (rol === 'admin') navigate('/admin');
        else if (rol === 'profesor') navigate('/profesor');
        else navigate('/dashboard');
      } else {
        setError('Correo o contraseña incorrectos');
      }
    } catch (e) {
      setCargando(false);
      setError('No se pudo conectar con el servidor');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="medical-shell" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem'
    }}>
      <div className="medical-panel medical-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="medical-icon-mark">OSCE</div>
          <h2 className="medical-title" style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
            Simulador OSCE
          </h2>
          <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '13px' }}>Acceso al entorno clínico</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 74, 90, 0.1)', border: '1px solid rgba(255, 74, 90, 0.35)',
            borderRadius: '8px', padding: '8px 12px',
            color: '#FF4A5A', fontSize: '13px', marginBottom: '12px'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
              Correo
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="medical-input"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="medical-input"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={cargando}
            className="medical-button"
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              marginTop: '4px', opacity: cargando ? 0.6 : 1
            }}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

          <button
            onClick={() => navigate('/registro')}
            className="medical-link-button"
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer'
            }}
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
