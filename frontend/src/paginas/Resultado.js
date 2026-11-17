import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Resultado() {
  const { casoId } = useParams();
  const navigate = useNavigate();

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    calcularEvaluacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calcularEvaluacion = async () => {
    const sesionId = sessionStorage.getItem(`sesion_osce_${casoId}`);
    const diagnostico = sessionStorage.getItem(`diagnostico_${casoId}`) || '';
    const radiografiaSubida = sessionStorage.getItem(`radiografia_subida_${casoId}`) === 'true';
    const sonidosEscuchados = sessionStorage.getItem(`sonidos_escuchados_${casoId}`) === 'true';

    if (!sesionId) {
      setError('No se encontró la sesión. Vuelve al inicio.');
      setCargando(false);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/evaluacion/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: sesionId,
          caso_id: casoId,
          diagnostico_estudiante: diagnostico,
          radiografia_subida: radiografiaSubida,
          sonidos_escuchados: sonidosEscuchados
        })
      });
      const data = await res.json();
      if (data.estado === 'ok') setResultado(data.resultado);
      else setError(data.mensaje || 'Error al calcular');
    } catch (e) {
      setError('No se pudo conectar con el servidor');
    }
    setCargando(false);
  };

  const getBloqueColor = (porcentaje) => {
    if (porcentaje >= 80) return { bg: 'rgba(100, 255, 218, 0.09)', texto: '#64FFDA', barra: '#64FFDA' };
    if (porcentaje >= 60) return { bg: 'rgba(0, 186, 199, 0.1)', texto: '#00BAC7', barra: '#00BAC7' };
    return { bg: 'rgba(255, 74, 90, 0.1)', texto: '#FF4A5A', barra: '#FF4A5A' };
  };

  const bloqueLabels = {
    saber_ser: { titulo: 'Saber Ser', subtitulo: 'Comunicación y ética', icono: 'SER' },
    saber_hacer: { titulo: 'Saber Hacer', subtitulo: 'Anamnesis guiada', icono: 'HAC' },
    saber_conocer: { titulo: 'Saber Conocer', subtitulo: 'Razonamiento diagnóstico', icono: 'DX' }
  };

  const detalleLabels = {
    presentacion: 'Presentación y consentimiento',
    empatia: 'Trato empático y cordial',
    vocabulario: 'Vocabulario adecuado',
    cierre: 'Cierre de entrevista',
    filiacion: 'Filiación e identificación',
    motivo_consulta: 'Interrogatorio del motivo de consulta',
    antecedentes: 'Antecedentes personales y familiares',
    revision_sistemas: 'Revisión por sistemas',
    exploracion: 'Técnica de exploración',
    radiografia: 'Solicitud de examen complementario',
    diagnostico: 'Juicio diagnóstico final'
  };

  if (cargando) return (
    <div className="medical-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64FFDA' }}>Calculando evaluación<span className="console-cursor">_</span></p>
    </div>
  );

  if (error) return (
    <div className="medical-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="medical-panel" style={{ borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#FF4A5A' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="medical-button" style={{
          marginTop: '1rem', padding: '8px 16px', borderRadius: '8px',
          fontWeight: 700, cursor: 'pointer'
        }}>Volver al inicio</button>
      </div>
    </div>
  );

  return (
    <div className="medical-shell">
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className="medical-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="medical-icon-mark" style={{ width: '36px', height: '36px', margin: 0, fontSize: '12px' }}>OS</span>
          <span className="medical-title" style={{ fontWeight: 800 }}>Resultado del examen OSCE</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="medical-button"
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          Volver al inicio
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="medical-panel" style={{
          borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
          borderColor: resultado.aprobado ? 'rgba(100, 255, 218, 0.32)' : 'rgba(255, 74, 90, 0.36)'
        }}>
          <p className="medical-title" style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: resultado.aprobado ? '#64FFDA' : '#FF4A5A' }}>
            {resultado.aprobado ? 'Examen aprobado' : 'Examen no aprobado'}
          </p>
          <p className="vital-number" style={{ fontSize: '38px', fontWeight: 800, margin: '8px 0', color: resultado.aprobado ? '#64FFDA' : '#FF4A5A' }}>
            {resultado.total} / {resultado.maximo}
          </p>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            {resultado.porcentaje}% · Mínimo requerido: 60%
          </p>

          <div style={{ maxWidth: '400px', margin: '1rem auto 0' }}>
            <div className="medical-progress-track" style={{ height: '10px' }}>
              <div className="medical-progress-fill" style={{
                background: resultado.aprobado ? '#64FFDA' : '#FF4A5A',
                width: `${resultado.porcentaje}%`
              }} />
            </div>
          </div>
        </div>

        {Object.entries(resultado.bloques).map(([bloque, data]) => {
          const porcentaje = Math.round((data.puntaje / data.maximo) * 100);
          const color = getBloqueColor(porcentaje);
          const label = bloqueLabels[bloque];
          return (
            <div key={bloque} className="medical-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="medical-icon-mark" style={{ width: '40px', height: '40px', margin: 0, fontSize: '12px' }}>{label.icono}</span>
                  <div>
                    <p className="medical-title" style={{ fontWeight: 800, margin: 0 }}>{label.titulo}</p>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{label.subtitulo}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="vital-number" style={{ fontWeight: 800, fontSize: '18px', margin: 0, color: color.texto }}>
                    {data.puntaje} / {data.maximo}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{porcentaje}%</p>
                </div>
              </div>

              <div className="medical-progress-track" style={{ marginBottom: '1rem' }}>
                <div className="medical-progress-fill" style={{ background: color.barra, width: `${porcentaje}%` }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(data.detalles).map(([key, val]) => {
                  if (key === 'alicia') return null;
                  const pts = typeof val === 'object' ? val.puntaje : val;
                  const max = typeof val === 'object' ? val.maximo : null;
                  const detailLabel = detalleLabels[key] || key;
                  const cumplido = pts > 0;
                  return (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', gap: '1rem', padding: '8px 12px',
                      background: cumplido ? 'rgba(100, 255, 218, 0.08)' : 'rgba(27, 42, 71, 0.62)',
                      borderRadius: '8px', border: `1px solid ${cumplido ? 'rgba(100, 255, 218, 0.24)' : 'rgba(148, 163, 184, 0.12)'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: cumplido ? '#64FFDA' : '#64748B', fontSize: '14px', fontWeight: 800 }}>
                          {cumplido ? '✓' : '○'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#E2E8F0' }}>{detailLabel}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: cumplido ? '#64FFDA' : '#94A3B8' }}>
                        {pts}{max ? ` / ${max}` : ''} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
          * El bloque de Saber Ser puede ser ajustado por tu profesor
        </p>
      </div>
    </div>
  );
}

export default Resultado;
