import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../servicios/api';

function Anamnesis() {
  const { casoId } = useParams();
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const sesionIdRef = useRef(`${usuario?.id}_${casoId}_${Date.now()}`);
  const sesionId = sesionIdRef.current;

  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [error, setError] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    iniciarCaso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensajes]);

  const iniciarCaso = async () => {
    try {
      const res = await api.iniciarCaso(casoId, sesionId);
      if (res.estado === 'ok') {
        setIniciado(true);
        sessionStorage.setItem(`sesion_osce_${casoId}`, sesionId);
        setMensajes([{ rol: 'sistema', texto: res.mensaje_inicial }]);
      } else {
        setError(res.error || res.mensaje || 'No se pudo iniciar el caso.');
      }
    } catch (e) {
      setError(`No se pudo conectar con el servidor: ${e.message}`);
    }
  };

  const enviarMensaje = async () => {
    if (!input.trim() || cargando) return;
    const textoUsuario = input.trim();
    setInput('');
    setMensajes(prev => [...prev, { rol: 'usuario', texto: textoUsuario }]);
    setCargando(true);
    setError('');
    try {
      const res = await api.enviarMensaje(casoId, textoUsuario, sesionId);
      if (res.estado === 'ok') {
        setMensajes(prev => [...prev, { rol: 'paciente', texto: res.respuesta }]);
      } else {
        setError(res.error || res.mensaje || 'No se pudo obtener respuesta del paciente.');
      }
    } catch (e) {
      setError(`No se pudo conectar con el servidor: ${e.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  return (
    <div className="medical-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }} className="medical-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}>←</button>
          <span className="medical-title" style={{ fontWeight: 800 }}>Módulo de Anamnesis</span>
          <span className="medical-badge" style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Paso 1 de 4</span>
        </div>
        <button
          onClick={() => navigate(`/diagnostico/${casoId}`)}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          className="medical-button"
        >
          Continuar → Diagnóstico
        </button>
      </div>

      <div style={{ flex: 1, maxWidth: '760px', width: '100%', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ borderRadius: '12px', padding: '1rem', fontSize: '13px', color: '#94A3B8' }} className="medical-panel-soft">
          <span style={{ color: '#64FFDA', fontWeight: 800 }}>[PROTOCOLO]</span> Realiza la entrevista clínica al paciente. Pregunta sobre síntomas, antecedentes y evolución.
        </div>

        <div
          ref={chatRef}
          style={{
            flex: 1, borderRadius: '12px',
            padding: '1rem',
            minHeight: '400px', maxHeight: '460px',
            overflowY: 'auto', display: 'flex',
            flexDirection: 'column', gap: '12px'
          }}
          className="medical-panel"
        >
          {error && (
            <div role="alert" style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#FCA5A5',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}
          {mensajes.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              {msg.rol === 'sistema' ? (
                <div style={{
                  background: 'rgba(100, 255, 218, 0.08)', border: '1px solid rgba(100, 255, 218, 0.22)',
                  borderRadius: '8px', padding: '8px 14px',
                  fontSize: '13px', color: '#64FFDA', width: '100%'
                }}>
                  {msg.texto}
                </div>
              ) : (
                <div style={{
                  width: '100%', padding: '10px 14px',
                  borderRadius: '8px',
                  background: msg.rol === 'usuario' ? 'rgba(0, 186, 199, 0.09)' : 'rgba(27, 42, 71, 0.72)',
                  border: `1px solid ${msg.rol === 'usuario' ? 'rgba(100, 255, 218, 0.2)' : 'rgba(148, 163, 184, 0.12)'}`,
                  color: '#E2E8F0',
                  fontSize: '14px', lineHeight: '1.5'
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, margin: '0 0 4px', color: msg.rol === 'usuario' ? '#64FFDA' : '#94A3B8' }}>
                    {msg.rol === 'usuario' ? '[MÉDICO]' : '[PACIENTE]'}
                  </p>
                  {msg.texto}
                </div>
              )}
            </div>
          ))}
          {cargando && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: 'rgba(27, 42, 71, 0.72)', borderRadius: '8px',
                border: '1px solid rgba(100, 255, 218, 0.18)',
                padding: '10px 16px', fontSize: '14px', color: '#94A3B8'
              }}>
                [PACIENTE] procesando respuesta<span className="console-cursor">_</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta al paciente..."
            disabled={!iniciado || cargando}
            className="medical-input"
            style={{ flex: 1, padding: '10px 14px', fontSize: '14px' }}
          />
          <button
            onClick={enviarMensaje}
            disabled={!iniciado || cargando || !input.trim()}
            style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: (!iniciado || cargando || !input.trim()) ? 0.5 : 1 }}
            className="medical-button"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Anamnesis;
