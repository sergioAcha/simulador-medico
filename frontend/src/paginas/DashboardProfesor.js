import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardProfesor({ setUsuario }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [criterios, setCriterios] = useState({});
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [vista, setVista] = useState('resumen');

  useEffect(() => {
    cargarSesiones();
  }, []);

  const cargarSesiones = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/profesor/sesiones');
      const data = await res.json();
      if (data.estado === 'ok') setSesiones(data.sesiones);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    navigate('/');
  };

  const formatTiempo = (seg) => {
    if (!seg) return '—';
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getPorcentaje = (puntaje = 0) => Math.round((puntaje / 155) * 100);

  const getEstado = (sesion) => {
    if (!sesion.completado) return { texto: 'En progreso', clase: 'medical-badge' };
    if (getPorcentaje(sesion.puntaje) >= 60) return { texto: 'Aprobado', clase: 'medical-badge' };
    return { texto: 'Reprobado', clase: 'medical-danger-badge' };
  };

  const casoNombre = {
    neumania: 'Neumonía Bacteriana',
    neumotorax: 'Neumotórax Espontáneo',
    derrame_pleural: 'Derrame Pleural'
  };

  const seleccionarSesion = (sesion) => {
    setSesionSeleccionada(sesion);
    setVista('resumen');
    setHistorial([]);
    setCriterios({});
  };

  const cargarHistorial = async () => {
    if (!sesionSeleccionada) return;
    setCargandoDetalle(true);
    setVista('historial');
    try {
      const res = await fetch(`http://127.0.0.1:8000/profesor/sesiones/${sesionSeleccionada.id}/historial`);
      const data = await res.json();
      if (data.estado === 'ok') setHistorial(data.historial);
    } catch (e) {
      console.error(e);
    }
    setCargandoDetalle(false);
  };

  const cargarCriterios = async () => {
    if (!sesionSeleccionada) return;
    setCargandoDetalle(true);
    setVista('criterios');
    try {
      const res = await fetch(`http://127.0.0.1:8000/profesor/sesiones/${sesionSeleccionada.id}/criterios`);
      const data = await res.json();
      if (data.estado === 'ok') setCriterios(data.criterios);
    } catch (e) {
      console.error(e);
    }
    setCargandoDetalle(false);
  };

  return (
    <div className="medical-shell">
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className="medical-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="medical-icon-mark" style={{ width: '36px', height: '36px', margin: 0, fontSize: '12px' }}>PR</span>
          <span className="medical-title" style={{ fontWeight: 800 }}>Simulador OSCE</span>
          <span className="medical-badge" style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Profesor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>{usuario?.nombre}</span>
          <button onClick={() => navigate('/profesor/clases')} style={{
            padding: '6px 14px', borderRadius: '8px',
            background: '#1d4ed8', color: 'white',
            border: 'none', fontSize: '13px', cursor: 'pointer'
          }}>
            Mis clases
          </button>
          <button onClick={handleLogout} className="medical-link-button" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        <div>
          <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '18px', marginBottom: '1rem' }}>Exámenes OSCE</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' }}>
            {[
              { label: 'Total', valor: sesiones.length },
              { label: 'Aprobados', valor: sesiones.filter(s => s.completado && getPorcentaje(s.puntaje) >= 60).length },
              { label: 'Reprobados', valor: sesiones.filter(s => s.completado && getPorcentaje(s.puntaje) < 60).length },
            ].map((stat) => (
              <div key={stat.label} className="vital-monitor" style={{ borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <p className="vital-number" style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 2px' }}>{stat.valor}</p>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cargando ? (
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Cargando...</p>
            ) : sesiones.length === 0 ? (
              <div className="medical-panel" style={{ borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                <p style={{ fontSize: '14px' }}>No hay exámenes aún</p>
              </div>
            ) : sesiones.map((s) => {
              const estado = getEstado(s);
              const seleccionado = sesionSeleccionada?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => seleccionarSesion(s)}
                  className="medical-panel-soft"
                  style={{
                    borderRadius: '10px',
                    borderColor: seleccionado ? '#64FFDA' : 'rgba(100, 255, 218, 0.14)',
                    padding: '12px 16px', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px' }}>{s.nombre || 'Estudiante'}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{casoNombre[s.caso_id] || s.caso_id}</p>
                    </div>
                    <span className={estado.clase} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', whiteSpace: 'nowrap' }}>{estado.texto}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {!sesionSeleccionada ? (
            <div className="medical-panel" style={{ borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
              Selecciona un examen para revisar detalles.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>
                  {sesionSeleccionada.nombre} · {casoNombre[sesionSeleccionada.caso_id]}
                </h2>
                <button onClick={() => setSesionSeleccionada(null)} className="medical-link-button" style={{ borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}>Cerrar</button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'resumen', label: 'Resumen', action: () => setVista('resumen') },
                  { id: 'historial', label: 'Anamnesis', action: cargarHistorial },
                  { id: 'criterios', label: 'Criterios', action: cargarCriterios },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={tab.action}
                    className={vista === tab.id ? 'medical-button' : 'medical-link-button'}
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {vista === 'resumen' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {[
                      { label: 'Puntaje', valor: `${sesionSeleccionada.puntaje} / 155` },
                      { label: 'Porcentaje', valor: `${getPorcentaje(sesionSeleccionada.puntaje)}%` },
                      { label: 'Tiempo', valor: formatTiempo(sesionSeleccionada.tiempo_segundos) },
                      { label: 'Fecha', valor: sesionSeleccionada.fecha ? new Date(sesionSeleccionada.fecha).toLocaleDateString() : '—' },
                    ].map((s) => (
                      <div key={s.label} className="vital-monitor" style={{ borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                        <p className="vital-number" style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>{s.valor}</p>
                        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <p className="medical-title" style={{ fontWeight: 800, margin: '0 0 12px' }}>Rendimiento general</p>
                    <div className="medical-progress-track" style={{ height: '10px', marginBottom: '8px' }}>
                      <div className="medical-progress-fill" style={{
                        background: getPorcentaje(sesionSeleccionada.puntaje) >= 60 ? '#64FFDA' : '#FF4A5A',
                        width: `${getPorcentaje(sesionSeleccionada.puntaje)}%`
                      }} />
                    </div>
                    <p style={{ fontSize: '13px', textAlign: 'center', color: getPorcentaje(sesionSeleccionada.puntaje) >= 60 ? '#64FFDA' : '#FF4A5A', fontWeight: 700 }}>
                      {getPorcentaje(sesionSeleccionada.puntaje) >= 60 ? 'Aprobado' : 'Reprobado'} · Mínimo requerido: 60%
                    </p>
                  </div>
                </div>
              )}

              {vista === 'historial' && (
                <div className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem', maxHeight: '520px', overflowY: 'auto' }}>
                  {cargandoDetalle ? <p style={{ color: '#94A3B8', textAlign: 'center' }}>Cargando historial...</p> : historial.length === 0 ? (
                    <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: '14px' }}>No hay historial de anamnesis para esta sesión</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {historial.map((msg, i) => (
                        <div key={i} style={{
                          padding: '10px 14px', borderRadius: '8px',
                          background: msg.rol === 'estudiante' ? 'rgba(0, 186, 199, 0.09)' : 'rgba(27, 42, 71, 0.72)',
                          border: `1px solid ${msg.rol === 'estudiante' ? 'rgba(100, 255, 218, 0.2)' : 'rgba(148, 163, 184, 0.12)'}`,
                          color: '#E2E8F0', fontSize: '14px', lineHeight: '1.5'
                        }}>
                          <p style={{ fontSize: '11px', fontWeight: 800, margin: '0 0 4px', color: msg.rol === 'estudiante' ? '#64FFDA' : '#94A3B8' }}>
                            {msg.rol === 'estudiante' ? '[MÉDICO]' : '[PACIENTE]'}
                          </p>
                          {msg.mensaje}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {vista === 'criterios' && (
                <div className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                  {cargandoDetalle ? <p style={{ color: '#94A3B8', textAlign: 'center' }}>Cargando criterios...</p> : Object.keys(criterios).length === 0 ? (
                    <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: '14px' }}>No hay criterios de evaluación para esta sesión</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(criterios).map(([modulo, items]) => {
                        const puntajeCumplido = items.reduce((sum, c) => sum + (c.cumplido ? c.puntaje : 0), 0);
                        const puntajeTotal = items.reduce((sum, c) => sum + c.puntaje, 0);
                        return (
                          <div key={modulo} className="medical-panel-soft" style={{ borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
                              <h3 className="medical-title" style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{modulo}</h3>
                              <span className="medical-badge" style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                                {puntajeCumplido} / {puntajeTotal} pts
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {items.map((criterio, i) => (
                                <div key={i} style={{
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                  padding: '8px', background: 'rgba(10, 25, 47, 0.55)',
                                  borderRadius: '8px', border: '1px solid rgba(100, 255, 218, 0.12)'
                                }}>
                                  <span style={{ color: criterio.cumplido ? '#64FFDA' : '#64748B', fontWeight: 800 }}>{criterio.cumplido ? '✓' : '○'}</span>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700 }}>{criterio.descripcion}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{criterio.puntaje} puntos</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardProfesor;
