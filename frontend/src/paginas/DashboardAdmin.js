import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardAdmin({ setUsuario }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/admin/usuarios');
      const data = await res.json();
      if (data.estado === 'ok') setUsuarios(data.usuarios);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  };

  const cambiarRol = async (id, nuevoRol) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/admin/usuarios/${id}/rol`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol })
      });
      const data = await res.json();
      if (data.estado === 'ok') {
        setMensaje('Rol actualizado correctamente');
        cargarUsuarios();
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/admin/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.estado === 'ok') {
        setMensaje('Usuario eliminado');
        cargarUsuarios();
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    navigate('/');
  };

  const rolColor = {
    admin: { bg: 'rgba(255, 74, 90, 0.1)', texto: '#FF4A5A', border: 'rgba(255, 74, 90, 0.32)' },
    profesor: { bg: 'rgba(0, 186, 199, 0.12)', texto: '#00BAC7', border: 'rgba(0, 186, 199, 0.32)' },
    estudiante: { bg: 'rgba(100, 255, 218, 0.1)', texto: '#64FFDA', border: 'rgba(100, 255, 218, 0.28)' }
  };

  return (
    <div className="medical-shell">
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className="medical-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="medical-icon-mark" style={{ width: '36px', height: '36px', margin: 0, fontSize: '12px' }}>AD</span>
          <span className="medical-title" style={{ fontWeight: 800 }}>Simulador OSCE</span>
          <span className="medical-danger-badge" style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>{usuario?.nombre}</span>
          <button onClick={handleLogout} className="medical-link-button" style={{
            padding: '6px 14px', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer'
          }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem' }}>
        <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '20px', marginBottom: '0.5rem' }}>
          Panel de administración
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '1.5rem' }}>
          Gestiona los usuarios y sus roles.
        </p>

        {mensaje && (
          <div className="medical-panel-soft" style={{
            borderRadius: '8px', padding: '8px 14px',
            color: '#64FFDA', fontSize: '13px', marginBottom: '1rem'
          }}>{mensaje}</div>
        )}

        <div className="medical-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: 'rgba(27, 42, 71, 0.92)', borderBottom: '1px solid rgba(100, 255, 218, 0.18)' }}>
                  {['Nombre', 'Correo', 'Rol actual', 'Cambiar rol', 'Acciones'].map((head) => (
                    <th key={head} className="medical-title" style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: '#94A3B8', fontSize: '12px' }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Cargando...</td></tr>
                ) : usuarios.map((u) => {
                  const rol = rolColor[u.rol] || rolColor.estudiante;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                      <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600 }}>{u.nombre}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: rol.bg, color: rol.texto, border: `1px solid ${rol.border}`,
                          padding: '2px 10px', borderRadius: '12px', fontSize: '12px'
                        }}>{u.rol}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.rol !== 'admin' && (
                          <select
                            value={u.rol}
                            onChange={e => cambiarRol(u.id, e.target.value)}
                            className="medical-input"
                            style={{ padding: '6px 8px', fontSize: '13px' }}
                          >
                            <option value="estudiante">Estudiante</option>
                            <option value="profesor">Profesor</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.rol !== 'admin' && (
                          <button
                            onClick={() => eliminarUsuario(u.id)}
                            style={{
                              padding: '6px 12px', borderRadius: '6px',
                              background: 'rgba(255, 74, 90, 0.1)', color: '#FF4A5A',
                              border: '1px solid rgba(255, 74, 90, 0.34)', fontSize: '12px',
                              cursor: 'pointer', fontWeight: 700
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
