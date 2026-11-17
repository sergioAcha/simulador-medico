import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const rol = 'estudiante';
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async () => {
    setError('');

    if (!nombre || !email || !password || !confirmar) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol })
      });
      const data = await res.json();
      setCargando(false);

      if (data.estado === 'ok') {
        localStorage.setItem('usuario', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        setError(data.mensaje || 'Error al registrarse');
      }
    } catch (e) {
      setCargando(false);
      setError('No se pudo conectar con el servidor');
    }
  };

  const campos = [
    { label: 'Nombre completo', type: 'text', placeholder: 'Tu nombre', value: nombre, onChange: setNombre },
    { label: 'Correo', type: 'email', placeholder: 'correo@ejemplo.com', value: email, onChange: setEmail },
    { label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres', value: password, onChange: setPassword },
    { label: 'Confirmar contraseña', type: 'password', placeholder: 'Repite la contraseña', value: confirmar, onChange: setConfirmar },
  ];

  return (
    <div className="medical-shell" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem'
    }}>
      <div className="medical-panel medical-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="medical-icon-mark">ID</div>
          <h2 className="medical-title" style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Crear cuenta</h2>
          <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '13px' }}>Simulador OSCE</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 74, 90, 0.1)', border: '1px solid rgba(255, 74, 90, 0.35)',
            borderRadius: '8px', padding: '8px 12px',
            color: '#FF4A5A', fontSize: '13px', marginBottom: '12px'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {campos.map((campo) => (
            <div key={campo.label}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                {campo.label}
              </label>
              <input
                type={campo.type}
                placeholder={campo.placeholder}
                value={campo.value}
                onChange={e => campo.onChange(e.target.value)}
                className="medical-input"
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
              />
            </div>
          ))}

          <button
            onClick={handleRegistro}
            disabled={cargando}
            className="medical-button"
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              marginTop: '4px', opacity: cargando ? 0.6 : 1
            }}
          >
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>

          <button
            onClick={() => navigate('/')}
            className="medical-link-button"
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

export default Registro;
