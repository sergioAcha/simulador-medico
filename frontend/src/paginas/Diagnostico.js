import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../servicios/api';

function Diagnostico() {
  const { casoId } = useParams();
  const navigate = useNavigate();
  const esCasoIA = casoId.startsWith('ia_');

  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [casoIA, setCasoIA] = useState(null);
  const [cargandoCasoIA, setCargandoCasoIA] = useState(esCasoIA);
  const [errorCasoIA, setErrorCasoIA] = useState('');

  useEffect(() => {
    if (!esCasoIA) return undefined;
    let activo = true;
    api.detalleCasoIA(casoId)
      .then(res => {
        if (!activo) return;
        if (res.estado === 'ok') {
          setCasoIA(res.caso);
          sessionStorage.setItem(`radiografia_subida_${casoId}`, 'true');
        } else {
          setErrorCasoIA(res.error || 'No se pudo cargar el caso generado.');
        }
      })
      .catch(error => {
        if (activo) setErrorCasoIA(`No se pudo conectar con el servidor: ${error.message}`);
      })
      .finally(() => {
        if (activo) setCargandoCasoIA(false);
      });
    return () => { activo = false; };
  }, [casoId, esCasoIA]);

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
    setResultado(null);
  };

  const analizar = async () => {
    if (!archivo) return;
    setCargando(true);
    const res = await api.analizarRadiografia(archivo);
    setCargando(false);
    if (res.estado === 'ok') setResultado(res.hallazgos);
  };

  const getColor = (confianza) => {
    if (confianza > 20) return { bg: 'rgba(255, 74, 90, 0.1)', texto: '#FF4A5A', barra: '#FF4A5A' };
    if (confianza > 10) return { bg: 'rgba(0, 186, 199, 0.12)', texto: '#64FFDA', barra: '#00BAC7' };
    return { bg: 'rgba(55, 230, 162, 0.1)', texto: '#37E6A2', barra: '#37E6A2' };
  };

  const continuarAuscultacion = () => {
    if (!diagnostico.trim()) {
      alert('Debes escribir tu diagnóstico presuntivo antes de continuar');
      return;
    }
    sessionStorage.setItem(`diagnostico_${casoId}`, diagnostico);
    sessionStorage.setItem(`radiografia_subida_${casoId}`, esCasoIA || archivo ? 'true' : 'false');
    navigate(`/auscultacion/${casoId}`);
  };

  return (
    <div className="medical-shell">
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className="medical-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(`/anamnesis/${casoId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}>←</button>
          <span className="medical-title" style={{ fontWeight: 800 }}>{esCasoIA ? 'Módulo de Diagnóstico' : 'Módulo de Diagnóstico por Imagen'}</span>
          <span className="medical-badge" style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Paso 2 de 4</span>
        </div>
        <button
          onClick={continuarAuscultacion}
          disabled={cargandoCasoIA || Boolean(errorCasoIA)}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          className="medical-button"
        >
          Continuar → Auscultación
        </button>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: esCasoIA ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {esCasoIA ? (
            <div className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
              {cargandoCasoIA ? (
                <p style={{ color: '#64FFDA', margin: 0 }}>Cargando los datos clínicos del caso...</p>
              ) : errorCasoIA ? (
                <p role="alert" style={{ color: '#FCA5A5', margin: 0 }}>{errorCasoIA}</p>
              ) : casoIA ? (
                <>
                  <p className="medical-title" style={{ fontWeight: 800, margin: '0 0 4px' }}>{casoIA.titulo}</p>
                  <p style={{ color: '#94A3B8', fontSize: '12px', margin: '0 0 1.25rem' }}>
                    Caso sintético · Dificultad {casoIA.dificultad}
                  </p>
                  <p className="medical-title" style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 8px' }}>Signos vitales</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '1.25rem' }}>
                    {[
                      { label: 'Frecuencia cardiaca', value: casoIA.datos_clinicos.signos_vitales.frecuencia_cardiaca, unit: 'lpm' },
                      { label: 'Frecuencia respiratoria', value: casoIA.datos_clinicos.signos_vitales.frecuencia_respiratoria, unit: 'rpm' },
                      { label: 'Saturación O₂', value: casoIA.datos_clinicos.signos_vitales.saturacion_oxigeno, unit: '%' },
                      { label: 'Temperatura', value: casoIA.datos_clinicos.signos_vitales.temperatura, unit: '°C' },
                      { label: 'Presión arterial', value: casoIA.datos_clinicos.signos_vitales.presion_arterial, unit: '' }
                    ].map(signo => (
                      <div key={signo.label} className="vital-monitor" style={{ borderRadius: '8px', padding: '10px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>{signo.label}</p>
                        <p className="vital-number" style={{ margin: 0, fontSize: '19px', fontWeight: 800 }}>
                          {signo.value}<span style={{ fontSize: '10px', marginLeft: '4px', color: '#94A3B8' }}>{signo.unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div className="medical-panel-soft" style={{ borderRadius: '8px', padding: '1rem' }}>
                      <p className="medical-title" style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 6px' }}>Exploración física</p>
                      <p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{casoIA.datos_clinicos.hallazgos_exploracion}</p>
                    </div>
                    <div className="medical-panel-soft" style={{ borderRadius: '8px', padding: '1rem' }}>
                      <p className="medical-title" style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 6px' }}>{casoIA.datos_clinicos.estudio_nombre}</p>
                      <p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{casoIA.datos_clinicos.estudio_resultado}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <>
          <div>
            <div style={{ borderRadius: '12px', padding: '1.5rem' }} className="medical-panel">
              <p className="medical-title" style={{ fontWeight: 800, margin: '0 0 1rem' }}>Radiografía de tórax</p>
              <label style={{
                display: 'block', border: '1px dashed rgba(100, 255, 218, 0.32)',
                borderRadius: '8px', padding: '1.5rem', textAlign: 'center',
                cursor: 'pointer', color: '#94A3B8', fontSize: '14px',
                background: '#081424', minHeight: '260px'
              }} className={`scanner-frame ${cargando ? 'is-scanning' : ''}`}>
                {preview ? (
                  <>
                    <img src={preview} alt="radiografia" style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto' }} />
                    {resultado && resultado[0] && (
                      <div className="heatmap-box">
                        <span className="heatmap-label">[{resultado[0].patologia} - {resultado[0].confianza.toFixed(1)}% certeza]</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="medical-icon-mark" style={{ marginBottom: '12px' }}>RX</div>
                    <p style={{ margin: 0 }}>Haz clic para subir una radiografía</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px' }}>PNG, JPG hasta 10MB</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleArchivo} style={{ display: 'none' }} />
              </label>
              <button
                onClick={analizar}
                disabled={!archivo || cargando}
                style={{ width: '100%', marginTop: '1rem', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: (!archivo || cargando) ? 0.5 : 1 }}
                className="medical-button"
              >
                {cargando ? 'Analizando...' : 'Analizar con IA'}
              </button>
            </div>
          </div>

          <div>
            <div style={{ borderRadius: '12px', padding: '1.5rem', minHeight: '300px' }} className="medical-panel">
              <p className="medical-title" style={{ fontWeight: 800, margin: '0 0 1rem' }}>Hallazgos de la IA</p>
              {!resultado && !cargando && (
                <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: '3rem' }}>
                  <div className="medical-icon-mark" style={{ marginBottom: '12px' }}>CNN</div>
                  <p style={{ fontSize: '13px' }}>Sube una radiografía para ver los hallazgos</p>
                </div>
              )}
              {cargando && (
                <div style={{ textAlign: 'center', color: '#64FFDA', marginTop: '3rem' }}>
                  <p style={{ fontSize: '14px' }}>Procesando imagen con la CNN<span className="console-cursor">_</span></p>
                </div>
              )}
              {resultado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resultado.map((h, i) => {
                    const c = getColor(h.confianza);
                    return (
                      <div key={i} style={{ background: c.bg, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${c.texto}33` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: c.texto }}>{h.patologia}</span>
                          <span style={{ fontSize: '13px', color: c.texto }}>{h.confianza.toFixed(1)}%</span>
                        </div>
                        <div className="medical-progress-track">
                          <div className="medical-progress-fill" style={{ background: c.barra, width: `${h.confianza}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>

        <div style={{ borderRadius: '12px', padding: '1.5rem' }} className="medical-panel">
          <p className="medical-title" style={{ fontWeight: 800, margin: '0 0 4px' }}>Diagnóstico presuntivo</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 1rem' }}>
            Basándote en la anamnesis y {esCasoIA ? 'los hallazgos del examen y del estudio complementario' : 'la radiografía'}, escribe tu diagnóstico.
          </p>
          <input
            type="text"
            placeholder="Ej: Neumonía lobar derecha, neumotórax espontáneo..."
            value={diagnostico}
            onChange={e => setDiagnostico(e.target.value)}
            className="medical-input"
            style={{ width: '100%', padding: '10px 14px', fontSize: '14px', marginBottom: '12px' }}
          />
          <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '14px' }}>Justificación</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 8px' }}>
            {esCasoIA ? '¿Qué datos clínicos justifican tu diagnóstico?' : '¿Por qué solicitaste la radiografía? ¿Qué hallazgos la justifican?'}
          </p>
          <textarea
            placeholder={esCasoIA ? 'Explica qué datos de la anamnesis, exploración y estudio apoyan tu diagnóstico...' : 'Ej: Solicité la radiografía porque el paciente presentaba tos productiva y fiebre alta...'}
            value={justificacion}
            onChange={e => setJustificacion(e.target.value)}
            rows={3}
            className="medical-input"
            style={{ width: '100%', padding: '10px 14px', fontSize: '14px', resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  );
}

export default Diagnostico;
