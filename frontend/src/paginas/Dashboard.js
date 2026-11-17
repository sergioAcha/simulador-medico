import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../servicios/api';

const CASOS_NOMBRES = {
  neumania: 'Caso 1 - Neumonía Bacteriana',
  neumotorax: 'Caso 2 - Neumotórax Espontáneo',
  derrame_pleural: 'Caso 3 - Derrame Pleural',
  crisis_asmatica: 'Caso 4 - Crisis Asmática',
  infarto_miocardio: 'Caso 5 - Infarto Agudo de Miocardio',
  tromboembolismo_pulmonar: 'Caso 6 - Tromboembolismo Pulmonar',
  bronquitis_cronica: 'Caso 7 - EPOC / Bronquitis Crónica',
  angina_inestable: 'Caso 8 - Angina Pectoris Inestable',
  pericarditis_aguda: 'Caso 9 - Pericarditis Aguda',
  insuficiencia_aortica: 'Caso 10 - Insuficiencia Aórtica',
  apendicitis_aguda: 'Caso 11 - Apendicitis Aguda',
  colecistitis_aguda: 'Caso 12 - Colecistitis Aguda',
};

function Dashboard({ setUsuario }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [filtro, setFiltro] = useState('Todos');
  const [vista, setVista] = useState('clases');
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [dificultadIA, setDificultadIA] = useState('facil');
  const [generandoCasoIA, setGenerandoCasoIA] = useState(false);
  const [errorCasoIA, setErrorCasoIA] = useState('');

  const casosList = [
    { id: 'neumania', titulo: 'Caso 1 - Neumonía Bacteriana', dificultad: 'Básico', sistema: 'Respiratorio' },
    { id: 'neumotorax', titulo: 'Caso 2 - Neumotórax Espontáneo', dificultad: 'Intermedio', sistema: 'Respiratorio' },
    { id: 'derrame_pleural', titulo: 'Caso 3 - Derrame Pleural', dificultad: 'Avanzado', sistema: 'Respiratorio' },
    { id: 'crisis_asmatica', titulo: 'Caso 4 - Crisis Asmática Moderada', dificultad: 'Intermedio', sistema: 'Respiratorio' },
    { id: 'infarto_miocardio', titulo: 'Caso 5 - Infarto Agudo de Miocardio', dificultad: 'Avanzado', sistema: 'Cardiovascular' },
    { id: 'tromboembolismo_pulmonar', titulo: 'Caso 6 - Tromboembolismo Pulmonar', dificultad: 'Avanzado', sistema: 'Cardiovascular' },
    { id: 'bronquitis_cronica', titulo: 'Caso 7 - EPOC / Bronquitis Crónica', dificultad: 'Intermedio', sistema: 'Respiratorio' },
    { id: 'angina_inestable', titulo: 'Caso 8 - Angina Pectoris Inestable', dificultad: 'Intermedio', sistema: 'Cardiovascular' },
    { id: 'pericarditis_aguda', titulo: 'Caso 9 - Pericarditis Aguda', dificultad: 'Avanzado', sistema: 'Cardiovascular' },
    { id: 'insuficiencia_aortica', titulo: 'Caso 10 - Insuficiencia Aórtica', dificultad: 'Avanzado', sistema: 'Cardiovascular' },
    { id: 'apendicitis_aguda', titulo: 'Caso 11 - Apendicitis Aguda', dificultad: 'Básico', sistema: 'Abdominal' },
    { id: 'colecistitis_aguda', titulo: 'Caso 12 - Colecistitis Aguda', dificultad: 'Intermedio', sistema: 'Abdominal' },
  ];

  const sistemas = ['Todos', 'Respiratorio', 'Cardiovascular', 'Abdominal'];

  const casosFiltrados = useMemo(() => {
    return filtro === 'Todos' ? casosList : casosList.filter(c => c.sistema === filtro);
  }, [filtro]);

  useEffect(() => {
    cargarClases();
  }, []);

  const cargarClases = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/estudiante/clases/${usuario.id}`);
      const data = await res.json();
      if (data.estado === 'ok') setClases(data.clases);
    } catch (e) { console.error(e); }
  };

  const seleccionarClase = async (clase) => {
    setClaseSeleccionada(clase);
    setVista('actividades');
    try {
      const res = await fetch(`http://127.0.0.1:8000/estudiante/clases/${clase.id}/actividades/${usuario.id}`);
      const data = await res.json();
      if (data.estado === 'ok') setActividades(data.actividades);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    navigate('/');
  };

  const iniciarActividad = (actividad) => {
    sessionStorage.setItem('actividad_actual', JSON.stringify(actividad));
    navigate(`/anamnesis/${actividad.caso_id}`);
  };

  const iniciarCasoLibre = (casoId) => {
    sessionStorage.removeItem('actividad_actual');
    navigate(`/anamnesis/${casoId}`);
  };

  const generarCasoIA = async () => {
    setGenerandoCasoIA(true);
    setErrorCasoIA('');
    try {
      const res = await api.generarCasoIA(dificultadIA);
      if (res.estado === 'ok' && res.caso?.id) {
        sessionStorage.removeItem('actividad_actual');
        navigate(`/anamnesis/${res.caso.id}`);
      } else {
        setErrorCasoIA(res.error || 'No se pudo generar el caso clínico.');
      }
    } catch (e) {
      setErrorCasoIA(`No se pudo conectar con el servidor: ${e.message}`);
    } finally {
      setGenerandoCasoIA(false);
    }
  };

  const ahora = new Date();

  const dificultadColor = {
    'Básico': 'rgba(29,78,216,0.15)',
    'Intermedio': 'rgba(161,98,7,0.15)',
    'Avanzado': 'rgba(220,38,38,0.15)',
  };

  const tipoColor = {
    tarea: 'rgba(29,78,216,0.15)',
    practica: 'rgba(161,98,7,0.15)',
    examen: 'rgba(220,38,38,0.15)',
  };

  return (
    <div className="medical-shell" style={{ display: 'flex', flexDirection: 'column' }}>

      <div className="medical-topbar" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🩺</span>
          <span className="medical-title" style={{ fontWeight: 800 }}>Simulador OSCE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--med-muted)' }}>
            {usuario?.nombre} · <span className="medical-badge">{usuario?.rol}</span>
          </span>
          <button onClick={handleLogout} className="medical-button-secondary" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', width: '100%', flex: 1 }}>

        {/* Tabs principales */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
          {[
            { id: 'clases', label: '📚 Mis clases' },
            { id: 'libre', label: '🏥 Práctica libre' },
            { id: 'ia', label: '✨ Casos nuevos con IA' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setVista(t.id)}
              className={(vista === t.id || (vista === 'actividades' && t.id === 'clases')) ? 'medical-button' : 'medical-button-secondary'}
              style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Vista: Mis clases */}
        {vista === 'clases' && (
          <div>
            <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '22px', marginBottom: '0.5rem' }}>
              Bienvenido, {usuario?.nombre}
            </h2>
            <p style={{ color: 'var(--med-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
              Estas son tus clases activas.
            </p>
            {clases.length === 0 ? (
              <div className="medical-panel" style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📚</p>
                <p style={{ fontSize: '14px', color: 'var(--med-muted)' }}>No estás inscrito en ninguna clase aún</p>
                <p style={{ fontSize: '13px', color: 'var(--med-muted)' }}>Pídele a tu profesor que te agregue</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {clases.map((clase, i) => (
                  <div key={i} className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}
                    onClick={() => seleccionarClase(clase)}>
                    <p style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 6px', color: 'var(--med-text)' }}>{clase.nombre}</p>
                    <p style={{ fontSize: '12px', color: 'var(--med-muted)', margin: '0 0 4px' }}>Semestre: {clase.semestre || '—'}</p>
                    <p style={{ fontSize: '12px', color: 'var(--med-muted)', margin: '0 0 16px' }}>Profesor: {clase.profesor_nombre}</p>
                    <button className="medical-button" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      Ver actividades →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista: Actividades de clase */}
        {vista === 'actividades' && claseSeleccionada && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <button onClick={() => setVista('clases')} className="medical-button-secondary" style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', border: 'none' }}>←</button>
              <div>
                <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '20px', margin: 0 }}>{claseSeleccionada.nombre}</h2>
                <p style={{ fontSize: '12px', color: 'var(--med-muted)', margin: 0 }}>Profesor: {claseSeleccionada.profesor_nombre}</p>
              </div>
            </div>

            {actividades.length === 0 ? (
              <div className="medical-panel" style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--med-muted)' }}>No hay actividades asignadas aún</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {actividades.map((a, i) => {
                  const vencida = a.fecha_limite && new Date(a.fecha_limite) < ahora;
                  const completada = (a.tipo === 'examen' && a.intentos_realizados > 0) ||
                    (a.tipo === 'practica' && a.intentos_realizados >= a.intentos_permitidos);
                  return (
                    <div key={i} className="medical-panel" style={{ borderRadius: '12px', padding: '1.25rem', borderColor: vencida ? 'rgba(220,38,38,0.4)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              background: tipoColor[a.tipo], color: 'var(--med-accent)',
                              padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                            }}>{a.tipo}</span>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: 'var(--med-text)' }}>{a.titulo}</p>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--med-muted)' }}>{CASOS_NOMBRES[a.caso_id] || a.caso_id}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: vencida ? '#dc2626' : 'var(--med-muted)' }}>
                            {a.fecha_limite ? `Entrega: ${new Date(a.fecha_limite).toLocaleString()}` : 'Sin fecha límite'}
                            {a.tipo === 'practica' && ` · ${a.intentos_realizados}/${a.intentos_permitidos} intentos`}
                          </p>
                        </div>
                        <button
                          onClick={() => !vencida && !completada && iniciarActividad(a)}
                          disabled={vencida || completada}
                          className={vencida || completada ? 'medical-button-secondary' : 'medical-button'}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: vencida || completada ? 'default' : 'pointer', flexShrink: 0, opacity: vencida || completada ? 0.5 : 1 }}
                        >
                          {vencida ? 'Vencida' : completada ? 'Completada' : 'Iniciar →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Vista: Práctica libre */}
        {vista === 'libre' && (
          <div>
            <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '22px', marginBottom: '0.5rem' }}>Práctica libre</h2>
            <p style={{ color: 'var(--med-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
              Practica con cualquier caso sin restricciones ni calificación.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {sistemas.map(s => (
                <button key={s} onClick={() => setFiltro(s)}
                  className={filtro === s ? 'medical-button' : 'medical-button-secondary'}
                  style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {casosFiltrados.map(caso => (
                <div key={caso.id} className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ background: dificultadColor[caso.dificultad], color: 'var(--med-accent)', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>
                      {caso.dificultad}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--med-muted)', background: 'rgba(100,255,218,0.05)', padding: '3px 10px', borderRadius: '8px' }}>
                      {caso.sistema}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--med-text)' }}>{caso.titulo}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--med-muted)' }}>Anamnesis → Diagnóstico → Auscultación → Resultado</p>
                  <button onClick={() => iniciarCasoLibre(caso.id)} className="medical-button"
                    style={{ padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
                    Iniciar práctica →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {vista === 'ia' && (
          <div>
            <h2 className="medical-title" style={{ fontWeight: 800, fontSize: '22px', marginBottom: '0.5rem' }}>
              Casos clínicos nuevos con IA
            </h2>
            <p style={{ color: 'var(--med-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
              Cada práctica genera desde cero un caso de un sistema clínico aleatorio, independiente de los casos existentes, para recorrer anamnesis, diagnóstico y auscultación.
            </p>
            <div className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem', maxWidth: '720px' }}>
              <p className="medical-title" style={{ fontWeight: 700, margin: '0 0 1rem' }}>Elige la dificultad</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
                {[
                  { id: 'facil', label: 'Fácil', detalle: 'Cuadro típico y directo' },
                  { id: 'medio', label: 'Medio', detalle: 'Más datos y diferenciales' },
                  { id: 'dificil', label: 'Difícil', detalle: 'Presentación menos evidente' }
                ].map(nivel => (
                  <button
                    key={nivel.id}
                    type="button"
                    onClick={() => setDificultadIA(nivel.id)}
                    aria-pressed={dificultadIA === nivel.id}
                    className={dificultadIA === nivel.id ? 'medical-button' : 'medical-button-secondary'}
                    style={{ padding: '12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>{nivel.label}</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>{nivel.detalle}</span>
                  </button>
                ))}
              </div>
              {errorCasoIA && (
                <p role="alert" style={{ color: '#FCA5A5', fontSize: '13px', margin: '0 0 1rem' }}>{errorCasoIA}</p>
              )}
              <button
                type="button"
                onClick={generarCasoIA}
                disabled={generandoCasoIA}
                className="medical-button"
                style={{ width: '100%', padding: '11px', borderRadius: '8px', fontWeight: 700, cursor: generandoCasoIA ? 'wait' : 'pointer', opacity: generandoCasoIA ? 0.65 : 1 }}
              >
                {generandoCasoIA ? 'Generando un caso original...' : 'Generar e iniciar caso →'}
              </button>
              <p style={{ color: 'var(--med-muted)', fontSize: '11px', lineHeight: 1.5, margin: '1rem 0 0' }}>
                Caso sintético para práctica educativa. Aunque se solicita coherencia clínica, revisa la información con tus fuentes docentes habituales.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;