const BASE_URL = "http://127.0.0.1:8000";

export const api = {
  analizarRadiografia: async (archivo) => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    const res = await fetch(`${BASE_URL}/diagnostico/analizar`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  iniciarCaso: async (caso_id, sesion_id) => {
    const res = await fetch(`${BASE_URL}/anamnesis/iniciar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caso_id, sesion_id }),
    });
    return res.json();
  },

  enviarMensaje: async (caso_id, mensaje, sesion_id) => {
    const res = await fetch(`${BASE_URL}/anamnesis/mensaje`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caso_id, mensaje, sesion_id }),
    });
    return res.json();
  },

  listarCasos: async () => {
    const res = await fetch(`${BASE_URL}/anamnesis/casos`);
    return res.json();
  },

  generarCasoIA: async (dificultad) => {
    const res = await fetch(`${BASE_URL}/casos-ia/generar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dificultad }),
    });
    return res.json();
  },

  detalleCasoIA: async (casoId) => {
    const res = await fetch(`${BASE_URL}/casos-ia/${casoId}`);
    return res.json();
  },

  listarSonidos: async () => {
    const res = await fetch(`${BASE_URL}/auscultacion/sonidos`);
    return res.json();
  },

  sonidosPorPatologia: async (patologia) => {
    const res = await fetch(`${BASE_URL}/auscultacion/caso/${patologia}`);
    return res.json();
  },

  iniciarSesionOsce: async (usuario_id, caso_id) => {
    const res = await fetch(`${BASE_URL}/osce/iniciar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id, caso_id }),
    });
    return res.json();
  },

  finalizarSesionOsce: async (sesion_id, criterios_cumplidos = []) => {
    const res = await fetch(`${BASE_URL}/osce/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sesion_id, criterios_cumplidos }),
    });
    return res.json();
  },
};
