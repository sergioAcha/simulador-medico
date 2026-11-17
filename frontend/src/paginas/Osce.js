import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../servicios/api';

function Osce() {
  const { casoId } = useParams();
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const [sesionId, setSesionId] = useState(null);
  const [criterios, setCriterios] = useState({});
  const [cumplidos, setCumplidos] = useState([]);
  const [tiempo, setTiempo] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [puntajeMaximo, setPuntajeMaximo] = useState(0);

  useEffect(() => {
    iniciarSesion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let intervalo;
    if (corriendo && !finalizado) {
      intervalo = setInterval(() => setTiempo(t => t + 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [corriendo, finalizado]);

  const iniciarSesion = async () => {
    const res = await api.iniciarSesionOsce(usuario?.id, casoId);
    if (res.estado === 'ok') {
      setSesionId(res.sesion_id);
      setCriterios(res.criterios);
      setPuntajeMaximo(res.puntaje_maximo);
      setCorriendo(true);
    }
  };

  const toggleCriterio = (id) => {
    if (finalizado) return;
    setCumplidos(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const formatTiempo = (seg) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const puntajeActual = () => {
    let total = 0;
    Object.values(criterios).forEach(modulo => {
      modulo.forEach(c => {
        if (cumplidos.includes(c.id)) total += c.puntaje;
      });
    });
    return total;
  };

  const finalizar = async () => {
    if (!sesionId) return;
    setCorriendo(false);

    await api.finalizarSesionOsce(sesionId, cumplidos);

    const puntaje = puntajeActual();
    const porcentaje = Math.round((puntaje / puntajeMaximo) * 100);

    setResumen({
      puntaje_obtenido: puntaje,
      puntaje_maximo: puntajeMaximo,
      porcentaje,
      tiempo_segundos: tiempo,
      aprobado: porcentaje >= 60
    });
    setFinalizado(true);
  };

  const moduloLabels = {
    anamnesis: 'Anamnesis',
    diagnostico: 'Diagnóstico',
    auscultacion: 'Auscultación'
  };

  return (
    <div className="medical-shell">
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className={`medical-topbar ${corriendo && !finalizado ? 'osce-active' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(`/auscultacion/${casoId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}>←</button>
          <span className="medical-title" style={{ fontWeight: 800 }}>Evaluación OSCE</span>
          <span className="medical-danger-badge" style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Paso 4 de 4</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="vital-monitor" style={{
            borderRadius: '8px', padding: '6px 16px',
            fontFamily: 'Consolas, monospace', fontSize: '20px',
            fontWeight: 800, color: corriendo ? '#FF4A5A' : '#94A3B8'
          }}>
            {formatTiempo(tiempo)}
          </div>
          {!finalizado && (
            <button
              onClick={finalizar}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                background: '#FF4A5A', color: '#061525',
                border: 'none', fontSize: '13px',
                fontWeight: 800, cursor: 'pointer'
              }}
            >
              Finalizar examen
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {finalizado && resumen && (
          <div className="medical-panel" style={{
            borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
            borderColor: resumen.aprobado ? 'rgba(100, 255, 218, 0.3)' : 'rgba(255, 74, 90, 0.36)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <p className="medical-title" style={{ fontWeight: 800, fontSize: '17px', margin: 0, color: resumen.aprobado ? '#64FFDA' : '#FF4A5A' }}>
                {resumen.aprobado ? 'Examen aprobado' : 'Examen no aprobado'}
              </p>
              <button
                onClick={() => navigate(`/resultado/${casoId}`)}
                className="medical-button"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                Ver resultado final
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Puntaje', valor: `${resumen.puntaje_obtenido} / ${resumen.puntaje_maximo}` },
                { label: 'Porcentaje', valor: `${resumen.porcentaje}%` },
                { label: 'Tiempo', valor: formatTiempo(resumen.tiempo_segundos) },
              ].map((s) => (
                <div key={s.label} className="vital-monitor" style={{ borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                  <p className="vital-number" style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>{s.valor}</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="medical-panel-soft" style={{
            borderRadius: '12px', padding: '1rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
          }}>
            <span style={{ fontSize: '14px', color: '#94A3B8' }}>Puntaje acumulado</span>
            <span className="vital-number" style={{ fontSize: '20px', fontWeight: 800 }}>
              {puntajeActual()} <span style={{ fontSize: '14px', color: '#94A3B8' }}>/ {puntajeMaximo} pts</span>
            </span>
          </div>

          {Object.entries(criterios).map(([modulo, lista]) => (
            <div key={modulo} className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
              <p className="medical-title" style={{ fontWeight: 800, fontSize: '15px', margin: '0 0 1rem' }}>
                {moduloLabels[modulo] || modulo}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lista.map(criterio => {
                  const checked = cumplidos.includes(criterio.id);
                  return (
                    <div
                      key={criterio.id}
                      onClick={() => toggleCriterio(criterio.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 14px', borderRadius: '8px',
                        border: `1px solid ${checked ? 'rgba(100, 255, 218, 0.4)' : 'rgba(148, 163, 184, 0.14)'}`,
                        background: checked ? 'rgba(100, 255, 218, 0.09)' : 'rgba(27, 42, 71, 0.62)',
                        cursor: finalizado ? 'default' : 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: `2px solid ${checked ? '#64FFDA' : '#475569'}`,
                        background: checked ? '#64FFDA' : 'transparent',
                        color: '#061525',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '11px', fontWeight: 800
                      }}>
                        {checked ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: '13px', flex: 1, color: '#E2E8F0' }}>{criterio.descripcion}</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: checked ? '#64FFDA' : '#94A3B8' }}>
                        {criterio.puntaje} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Osce;
