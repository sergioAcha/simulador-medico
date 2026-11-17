import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CASOS = [
  { id: 'neumania', titulo: 'Caso 1 - Neumonía Bacteriana' },
  { id: 'neumotorax', titulo: 'Caso 2 - Neumotórax Espontáneo' },
  { id: 'derrame_pleural', titulo: 'Caso 3 - Derrame Pleural' },
  { id: 'crisis_asmatica', titulo: 'Caso 4 - Crisis Asmática' },
  { id: 'infarto_miocardio', titulo: 'Caso 5 - Infarto Agudo de Miocardio' },
  { id: 'tromboembolismo_pulmonar', titulo: 'Caso 6 - Tromboembolismo Pulmonar' },
  { id: 'bronquitis_cronica', titulo: 'Caso 7 - EPOC / Bronquitis Crónica' },
  { id: 'angina_inestable', titulo: 'Caso 8 - Angina Pectoris Inestable' },
  { id: 'pericarditis_aguda', titulo: 'Caso 9 - Pericarditis Aguda' },
  { id: 'insuficiencia_aortica', titulo: 'Caso 10 - Insuficiencia Aórtica' },
  { id: 'apendicitis_aguda', titulo: 'Caso 11 - Apendicitis Aguda' },
  { id: 'colecistitis_aguda', titulo: 'Caso 12 - Colecistitis Aguda' },
];

function DetalleClase() {
  const { claseId } = useParams();
  const navigate = useNavigate();
  const [clase, setClase] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [tab, setTab] = useState('estudiantes');
  const [formActividad, setFormActividad] = useState({
    tipo: 'tarea', titulo: '', caso_id: 'neumania',
    fecha_limite: '', intentos_permitidos: 1
  });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDetalle();
    cargarActividades();
  }, []);

  const cargarDetalle = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/profesor/clases/${claseId}`);
      const data = await res.json();
      if (data.estado === 'ok') {
        setClase(data.clase);
        setEstudiantes(data.estudiantes);
        setDisponibles(data.disponibles);
      }
    } catch (e) { console.error(e); }
  };

  const cargarActividades = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/profesor/clases/${claseId}/actividades`);
      const data = await res.json();
      if (data.estado === 'ok') setActividades(data.actividades);
    } catch (e) { console.error(e); }
  };

  const agregarEstudiante = async (estudianteId) => {
    try {
      await fetch(`http://127.0.0.1:8000/profesor/clases/${claseId}/estudiantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudiante_id: estudianteId })
      });
      mostrarMensaje('Estudiante agregado');
      cargarDetalle();
    } catch (e) { console.error(e); }
  };

  const eliminarEstudiante = async (estudianteId) => {
    if (!window.confirm('¿Quitar este estudiante de la clase?')) return;
    try {
      await fetch(`http://127.0.0.1:8000/profesor/clases/${claseId}/estudiantes/${estudianteId}`, { method: 'DELETE' });
      mostrarMensaje('Estudiante eliminado');
      cargarDetalle();
    } catch (e) { console.error(e); }
  };

  const crearActividad = async () => {
    if (!formActividad.titulo.trim()) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/profesor/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formActividad, clase_id: parseInt(claseId) })
      });
      const data = await res.json();
      if (data.estado === 'ok') {
        mostrarMensaje('Actividad creada correctamente');
        setFormActividad({ tipo: 'tarea', titulo: '', caso_id: 'neumania', fecha_limite: '', intentos_permitidos: 1 });
        cargarActividades();
      }
    } catch (e) { console.error(e); }
  };

  const eliminarActividad = async (id) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try {
      await fetch(`http://127.0.0.1:8000/profesor/actividades/${id}`, { method: 'DELETE' });
      cargarActividades();
    } catch (e) { console.error(e); }
  };

  const mostrarMensaje = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 3000);
  };

  const tipoColor = {
    tarea: { bg: 'rgba(29, 78, 216, 0.1)', texto: 'var(--med-accent)' },
    practica: { bg: 'rgba(255, 74, 90, 0.1)', texto: 'var(--med-danger)' },
    examen: { bg: 'rgba(55, 230, 162, 0.1)', texto: 'var(--med-success)' }
  };

  return (
    <div className="medical-shell">
      <div className="medical-topbar" style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/profesor/clases')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--med-muted)'
          }}>←</button>
          <div>
            <p style={{ fontWeight: 500, margin: 0 }}>{clase?.nombre || 'Cargando...'}</p>
            {clase?.semestre && <p style={{ fontSize: '12px', color: 'var(--med-muted)', margin: 0 }}>Semestre: {clase.semestre}</p>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        {mensaje && (
          <div style={{
            background: 'rgba(55, 230, 162, 0.1)', border: '1px solid rgba(55, 230, 162, 0.3)',
            borderRadius: '8px', padding: '8px 14px',
            color: 'var(--med-success)', fontSize: '13px', marginBottom: '1rem'
          }}>{mensaje}</div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {['estudiantes', 'actividades'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: '8px',
              background: tab === t ? '#1d4ed8' : 'rgba(27, 42, 71, 0.9)',
              color: tab === t ? 'white' : 'var(--med-text)',
              border: `1px solid ${tab === t ? '#1d4ed8' : 'rgba(100, 255, 218, 0.14)'}`,
              fontSize: '13px', fontWeight: 500, cursor: 'pointer'
            }}>
              {t === 'estudiantes' ? 'Estudiantes' : 'Actividades'}
            </button>
          ))}
        </div>

        {/* Tab estudiantes */}
        {tab === 'estudiantes' && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, margin: '0 0 1rem', fontSize: '14px' }}>
                En esta clase ({estudiantes.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {estudiantes.length === 0 ? (
                  <div className="medical-panel" style={{ borderRadius: '10px', padding: '2rem', textAlign: 'center', color: 'var(--med-muted)' }}>
                    <p style={{ fontSize: '13px' }}>No hay estudiantes en esta clase</p>
                  </div>
                ) : estudiantes.map((e, i) => (
                  <div key={i} className="medical-panel-soft" style={{
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{e.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--med-muted)' }}>{e.email}</p>
                    </div>
                    <button onClick={() => eliminarEstudiante(e.id)} className="medical-danger-badge" style={{
                      padding: '4px 12px', borderRadius: '6px',
                      border: '1px solid rgba(255, 74, 90, 0.3)', background: 'rgba(255, 74, 90, 0.1)', color: 'var(--med-danger)',
                      fontSize: '12px', cursor: 'pointer'
                    }}>Quitar</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: '280px' }}>
              <p style={{ fontWeight: 500, margin: '0 0 1rem', fontSize: '14px' }}>
                Agregar estudiantes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {disponibles.length === 0 ? (
                  <div className="medical-panel" style={{ borderRadius: '10px', padding: '1.5rem', textAlign: 'center', color: 'var(--med-muted)' }}>
                    <p style={{ fontSize: '13px' }}>No hay más estudiantes disponibles</p>
                  </div>
                ) : disponibles.map((e, i) => (
                  <div key={i} className="medical-panel-soft" style={{
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{e.nombre}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--med-muted)' }}>{e.email}</p>
                    </div>
                    <button onClick={() => agregarEstudiante(e.id)} style={{
                      padding: '4px 12px', borderRadius: '6px',
                      background: '#1d4ed8', color: 'white',
                      border: 'none', fontSize: '12px', cursor: 'pointer'
                    }}>Agregar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab actividades */}
        {tab === 'actividades' && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, margin: '0 0 1rem', fontSize: '14px' }}>
                Actividades ({actividades.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actividades.length === 0 ? (
                  <div className="medical-panel" style={{ borderRadius: '10px', padding: '2rem', textAlign: 'center', color: 'var(--med-muted)' }}>
                    <p style={{ fontSize: '13px' }}>No hay actividades creadas</p>
                  </div>
                ) : actividades.map((a, i) => (
                  <div key={i} className="medical-panel-soft" style={{
                    borderRadius: '10px',
                    padding: '12px 16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            background: tipoColor[a.tipo]?.bg, color: tipoColor[a.tipo]?.texto,
                            padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500
                          }}>{a.tipo}</span>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{a.titulo}</p>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--med-muted)' }}>
                          {CASOS.find(c => c.id === a.caso_id)?.titulo || a.caso_id}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--med-muted)' }}>
                          {a.fecha_limite ? `Entrega: ${new Date(a.fecha_limite).toLocaleDateString()}` : 'Sin fecha límite'}
                          {a.tipo === 'practica' && ` · ${a.intentos_permitidos} intento(s)`}
                          {` · ${a.total_intentos} entrega(s)`}
                        </p>
                      </div>
                      <button onClick={() => eliminarActividad(a.id)} className="medical-danger-badge" style={{
                        padding: '4px 12px', borderRadius: '6px',
                        border: '1px solid rgba(255, 74, 90, 0.3)', background: 'rgba(255, 74, 90, 0.1)', color: 'var(--med-danger)',
                        fontSize: '12px', cursor: 'pointer', flexShrink: 0
                      }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crear actividad */}
            <div style={{ width: '280px' }}>
              <p style={{ fontWeight: 500, margin: '0 0 1rem', fontSize: '14px' }}>Nueva actividad</p>
              <div className="medical-panel" style={{
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Tipo</label>
                  <select value={formActividad.tipo} onChange={e => setFormActividad({ ...formActividad, tipo: e.target.value })}
                    className="medical-input"
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="tarea">Tarea</option>
                    <option value="practica">Práctica</option>
                    <option value="examen">Examen</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Título</label>
                  <input type="text" placeholder="Nombre de la actividad"
                    value={formActividad.titulo} onChange={e => setFormActividad({ ...formActividad, titulo: e.target.value })}
                    className="medical-input"
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Caso clínico</label>
                  <select value={formActividad.caso_id} onChange={e => setFormActividad({ ...formActividad, caso_id: e.target.value })}
                    className="medical-input"
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
                    {CASOS.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Fecha límite</label>
                  <input type="datetime-local"
                    value={formActividad.fecha_limite} onChange={e => setFormActividad({ ...formActividad, fecha_limite: e.target.value })}
                    className="medical-input"
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                {formActividad.tipo === 'practica' && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--med-muted)', display: 'block', marginBottom: '4px' }}>Intentos permitidos</label>
                    <input type="number" min="1" max="10"
                      value={formActividad.intentos_permitidos} onChange={e => setFormActividad({ ...formActividad, intentos_permitidos: parseInt(e.target.value) })}
                      className="medical-input"
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
                <button onClick={crearActividad} style={{
                  padding: '10px', borderRadius: '8px', background: '#1d4ed8',
                  color: 'white', border: 'none', fontSize: '14px',
                  fontWeight: 500, cursor: 'pointer'
                }}>
                  Crear actividad
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetalleClase;