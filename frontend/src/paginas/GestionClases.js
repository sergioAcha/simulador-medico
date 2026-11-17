import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GestionClases() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [clases, setClases] = useState([]);
  const [vista, setVista] = useState('lista');
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', semestre: '' });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarClases();
  }, []);

  const cargarClases = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/profesor/clases?profesor_id=${usuario.id}`);
      const data = await res.json();
      if (data.estado === 'ok') setClases(data.clases);
    } catch (e) { console.error(e); }
  };

  const crearClase = async () => {
    if (!form.nombre.trim()) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/profesor/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profesor_id: usuario.id })
      });
      const data = await res.json();
      if (data.estado === 'ok') {
        setMensaje('Clase creada correctamente');
        setForm({ nombre: '', descripcion: '', semestre: '' });
        cargarClases();
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (e) { console.error(e); }
  };

  const eliminarClase = async (id) => {
    if (!window.confirm('¿Eliminar esta clase y todas sus actividades?')) return;
    try {
      await fetch(`http://127.0.0.1:8000/profesor/clases/${id}`, { method: 'DELETE' });
      cargarClases();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="medical-shell">
      <div className="medical-topbar" style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/profesor')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--med-muted)'
          }}>←</button>
          <span style={{ fontWeight: 500 }}>Gestión de clases</span>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem', display: 'flex', gap: '1.5rem' }}>

        {/* Crear clase */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div className="medical-panel" style={{
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <p style={{ fontWeight: 500, margin: '0 0 1rem' }}>Nueva clase</p>

            {mensaje && (
              <div style={{
                background: 'rgba(55, 230, 162, 0.1)', border: '1px solid rgba(55, 230, 162, 0.3)',
                borderRadius: '8px', padding: '8px 12px',
                color: 'var(--med-success)', fontSize: '13px', marginBottom: '12px'
              }}>{mensaje}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Nombre de la clase</label>
                <input
                  type="text" placeholder="Ej: Semiología 2025 - Grupo A"
                  value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="medical-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Semestre</label>
                <input
                  type="text" placeholder="Ej: 2025-I"
                  value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })}
                  className="medical-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Descripción</label>
                <textarea
                  placeholder="Descripción opcional..."
                  value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="medical-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button onClick={crearClase} className="medical-button" style={{
                padding: '10px', borderRadius: '8px',
                color: 'white', border: 'none', fontSize: '14px',
                fontWeight: 500, cursor: 'pointer', background: '#1d4ed8'
              }}>
                Crear clase
              </button>
            </div>
          </div>
        </div>

        {/* Lista de clases */}
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500, fontSize: '16px', margin: '0 0 1rem' }}>
            Mis clases ({clases.length})
          </p>
          {clases.length === 0 ? (
            <div className="medical-panel" style={{
              borderRadius: '12px',
              padding: '3rem', textAlign: 'center', color: 'var(--med-muted)'
            }}>
              <p style={{ fontSize: '14px' }}>No tienes clases creadas aún</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {clases.map((clase, i) => (
                <div key={i} className="medical-panel-soft" style={{
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 500, margin: '0 0 4px', fontSize: '15px' }}>{clase.nombre}</p>
                      <p style={{ fontSize: '12px', color: 'var(--med-muted)', margin: '0 0 4px' }}>
                        {clase.semestre && `Semestre: ${clase.semestre} · `}
                        {clase.total_estudiantes} estudiante{clase.total_estudiantes !== 1 ? 's' : ''}
                      </p>
                      {clase.descripcion && (
                        <p style={{ fontSize: '13px', color: 'var(--med-text)', margin: 0 }}>{clase.descripcion}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => navigate(`/profesor/clases/${clase.id}`)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          background: '#1d4ed8', color: 'white',
                          border: 'none', fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        Gestionar
                      </button>
                      <button
                        onClick={() => eliminarClase(clase.id)}
                        className="medical-danger-badge"
                        style={{
                          padding: '6px 14px', borderRadius: '8px', 
                          fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(255, 74, 90, 0.3)', background: 'rgba(255, 74, 90, 0.1)', color: 'var(--med-danger)'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionClases;