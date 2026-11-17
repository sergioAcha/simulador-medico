import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../servicios/api';

function Auscultacion() {
  const { casoId } = useParams();
  const navigate = useNavigate();

  const [sonidos, setSonidos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [casoIA, setCasoIA] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarSonidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarSonidos = async () => {
    try {
      const res = await api.sonidosPorPatologia(casoId);
      if (res.sonidos) {
        setSonidos(res.sonidos);
        setSeleccionado(res.sonidos[0]);
      } else {
        setError(res.error || 'No se pudieron cargar los sonidos del caso.');
      }
      if (casoId.startsWith('ia_')) {
        const detalle = await api.detalleCasoIA(casoId);
        if (detalle.estado === 'ok') setCasoIA(detalle.caso);
        else setError(detalle.error || 'No se pudieron cargar los datos clínicos del caso.');
      }
    } catch (e) {
      setError(`No se pudo conectar con el servidor: ${e.message}`);
    }
  };

  const reproducirTono = (frecuencia, duracion, tipo) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = tipo || 'sine';
    oscillator.frequency.setValueAtTime(frecuencia, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duracion);
  };

  const patronesSonido = {
    normal: () => [0, 0.6, 1.2, 1.8].forEach(t => setTimeout(() => reproducirTono(120, 0.5, 'sine'), t * 1000)),
    crepitantes: () => {
      for (let i = 0; i < 12; i++) setTimeout(() => reproducirTono(800 + Math.random() * 400, 0.05, 'square'), i * 80);
    },
    sibilancias: () => {
      reproducirTono(600, 1.5, 'sawtooth');
      setTimeout(() => reproducirTono(700, 1.5, 'sawtooth'), 200);
    },
    roncus: () => {
      reproducirTono(150, 1.2, 'sawtooth');
      setTimeout(() => reproducirTono(180, 1.2, 'sawtooth'), 400);
    },
    frote_pleural: () => {
      for (let i = 0; i < 6; i++) setTimeout(() => reproducirTono(300 + i * 50, 0.15, 'square'), i * 150);
    },
    normal_cardiaco: () => {
      reproducirTono(80, 0.15, 'sine');
      setTimeout(() => reproducirTono(100, 0.1, 'sine'), 200);
      setTimeout(() => reproducirTono(80, 0.15, 'sine'), 800);
      setTimeout(() => reproducirTono(100, 0.1, 'sine'), 1000);
    },
    soplo_sistolico: () => {
      reproducirTono(80, 0.15, 'sine');
      for (let i = 0; i < 8; i++) setTimeout(() => reproducirTono(200 + i * 30, 0.08, 'sawtooth'), 200 + i * 40);
      setTimeout(() => reproducirTono(100, 0.1, 'sine'), 700);
    },
    s3: () => {
      reproducirTono(80, 0.15, 'sine');
      setTimeout(() => reproducirTono(100, 0.1, 'sine'), 200);
      setTimeout(() => reproducirTono(60, 0.2, 'sine'), 400);
    }
  };

  const reproducir = (id) => {
    if (reproduciendo) return;
    setReproduciendo(true);
    const patron = patronesSonido[id];
    if (patron) patron();
    setTimeout(() => setReproduciendo(false), 2000);
  };

  const continuarOsce = () => {
    sessionStorage.setItem(`sonidos_escuchados_${casoId}`, 'true');
    navigate(`/osce/${casoId}`);
  };

  const getTipoColor = (tipo) => {
    return tipo === 'cardiaco'
      ? { bg: 'rgba(255, 74, 90, 0.1)', texto: '#FF4A5A', badge: 'rgba(255, 74, 90, 0.16)' }
      : { bg: 'rgba(100, 255, 218, 0.09)', texto: '#64FFDA', badge: 'rgba(100, 255, 218, 0.14)' };
  };

  return (
    <div className="medical-shell">
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className="medical-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(`/diagnostico/${casoId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}>←</button>
          <span className="medical-title" style={{ fontWeight: 800 }}>Módulo de Auscultación</span>
          <span className="medical-badge" style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Paso 3 de 4</span>
        </div>
        <button
          onClick={continuarOsce}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          className="medical-button"
        >
          Iniciar OSCE
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {error && (
          <p role="alert" style={{ gridColumn: '1 / -1', color: '#FCA5A5', margin: 0 }}>{error}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p className="medical-title" style={{ fontWeight: 800, fontSize: '14px', margin: '0 0 8px', color: '#E2E8F0' }}>
            Sonidos del caso
          </p>
          {sonidos.map((s, i) => {
            const c = getTipoColor(s.tipo);
            return (
              <div
                key={i}
                onClick={() => setSeleccionado(s)}
                style={{
                  background: seleccionado?.id === s.id ? c.bg : 'rgba(17, 34, 64, 0.82)',
                  border: `1px solid ${seleccionado?.id === s.id ? c.texto : 'rgba(100, 255, 218, 0.14)'}`,
                  borderRadius: '10px', padding: '12px 14px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  color: '#E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{s.nombre}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: c.badge, color: c.texto }}>{s.tipo}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="vital-monitor" style={{
            borderRadius: '12px', padding: '1rem', marginBottom: '1rem',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px'
          }}>
            {(casoIA ? [
              { label: 'FC', value: casoIA.datos_clinicos.signos_vitales.frecuencia_cardiaca, unit: 'lpm' },
              { label: 'FR', value: casoIA.datos_clinicos.signos_vitales.frecuencia_respiratoria, unit: 'rpm' },
              { label: 'SpO2', value: casoIA.datos_clinicos.signos_vitales.saturacion_oxigeno, unit: '%' },
              { label: 'Temp.', value: casoIA.datos_clinicos.signos_vitales.temperatura, unit: '°C' },
              { label: 'PA', value: casoIA.datos_clinicos.signos_vitales.presion_arterial, unit: '' },
            ] : [
              { label: 'FC', value: casoId === 'neumotorax' ? '118' : '96', unit: 'lpm' },
              { label: 'FR', value: casoId === 'derrame_pleural' ? '28' : '22', unit: 'rpm' },
              { label: 'SpO2', value: casoId === 'neumotorax' ? '89' : '93', unit: '%' },
            ]).map((v) => (
              <div key={v.label} style={{ borderRight: v.label !== 'SpO2' ? '1px solid rgba(100, 255, 218, 0.16)' : 'none' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94A3B8', fontWeight: 800 }}>{v.label}</p>
                <p className="vital-number" style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: v.value === '89' ? '#FF4A5A' : undefined }}>
                  {v.value}<span style={{ fontSize: '11px', marginLeft: '4px', color: '#94A3B8' }}>{v.unit}</span>
                </p>
              </div>
            ))}
          </div>
          {seleccionado ? (
            <div style={{ borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="medical-panel">
              <div>
                <p className="medical-title" style={{ fontWeight: 800, fontSize: '17px', margin: '0 0 4px' }}>{seleccionado.nombre}</p>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>{seleccionado.descripcion}</p>
              </div>

              <div style={{ background: '#081424', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '60px' }} aria-label="Representación visual del sonido">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} style={{
                      width: '4px', borderRadius: '2px',
                      background: reproduciendo ? '#64FFDA' : '#334155',
                      height: reproduciendo ? `${20 + Math.random() * 40}px` : '8px',
                      transition: 'height 0.1s ease'
                    }} />
                  ))}
                </div>
                <button
                  onClick={() => reproducir(seleccionado.id)}
                  disabled={reproduciendo}
                  style={{ marginTop: '1rem', padding: '8px 24px', borderRadius: '20px', background: reproduciendo ? '#334155' : '#64FFDA', color: reproduciendo ? '#E2E8F0' : '#061525', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {reproduciendo ? '▶ Reproduciendo...' : '▶ Reproducir sonido'}
                </button>
              </div>

              <div>
                <p className="medical-title" style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px', color: '#E2E8F0' }}>
                  Características clínicas
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {seleccionado.caracteristicas?.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#CBD5E1' }}>
                      <span style={{ color: '#64FFDA', fontWeight: 800 }}>✓</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#94A3B8' }} className="medical-panel">
              <div className="medical-icon-mark">AU</div>
              <p style={{ fontSize: '13px' }}>Selecciona un sonido para escucharlo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auscultacion;
