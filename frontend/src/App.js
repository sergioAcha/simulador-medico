import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Dashboard from './paginas/Dashboard';
import Anamnesis from './paginas/Anamnesis';
import Diagnostico from './paginas/Diagnostico';
import Auscultacion from './paginas/Auscultacion';
import DashboardProfesor from './paginas/DashboardProfesor';
import DashboardAdmin from './paginas/DashboardAdmin';
import Resultado from './paginas/Resultado';
import Osce from './paginas/Osce';
import GestionClases from './paginas/GestionClases';
import DetalleClase from './paginas/DetalleClase';

function App() {
  const handleSetUsuario = (u) => {
    if (u) localStorage.setItem('usuario', JSON.stringify(u));
  };

  const RutaProtegida = ({ elemento, roles }) => {
    const u = JSON.parse(localStorage.getItem('usuario'));
    if (!u) return <Navigate to="/" />;
    if (roles && !roles.includes(u.rol)) return <Navigate to="/" />;
    return elemento;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUsuario={handleSetUsuario} />} />
        <Route path="/registro" element={<Registro setUsuario={handleSetUsuario} />} />
        <Route path="/dashboard" element={<RutaProtegida elemento={<Dashboard setUsuario={handleSetUsuario} />} roles={['estudiante']} />} />
        <Route path="/profesor" element={<RutaProtegida elemento={<DashboardProfesor setUsuario={handleSetUsuario} />} roles={['profesor']} />} />
        <Route path="/admin" element={<RutaProtegida elemento={<DashboardAdmin setUsuario={handleSetUsuario} />} roles={['admin']} />} />
        <Route path="/anamnesis/:casoId" element={<RutaProtegida elemento={<Anamnesis />} roles={['estudiante']} />} />
        <Route path="/diagnostico/:casoId" element={<RutaProtegida elemento={<Diagnostico />} roles={['estudiante']} />} />
        <Route path="/auscultacion/:casoId" element={<RutaProtegida elemento={<Auscultacion />} roles={['estudiante']} />} />
        <Route path="/osce/:casoId" element={<RutaProtegida elemento={<Osce />} roles={['estudiante']} />} />
        <Route path="/resultado/:casoId" element={<RutaProtegida elemento={<Resultado />} roles={['estudiante']} />} />
        <Route path="/profesor/clases" element={<RutaProtegida elemento={<GestionClases />} roles={['profesor']} />} />
        <Route path="/profesor/clases/:claseId" element={<RutaProtegida elemento={<DetalleClase />} roles={['profesor']} />} />
      </Routes>
    </Router>
  );
}

export default App;
