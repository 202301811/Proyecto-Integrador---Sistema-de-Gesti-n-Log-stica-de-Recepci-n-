"use client";
import { useState } from 'react';
import { Search, Clock, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function ControlCasetaPage() {
  const [numeroPedido, setNumeroPedido] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setResultado(null);

    try {
      const res = await fetch('http://localhost:4000/api/llegadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroPedido: numeroPedido.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || 'Error al registrar el arribo');
      }

      // Si todo sale bien, guardamos el resultado para mostrar la alerta
      setResultado(data);
      setNumeroPedido(''); // Limpiamos el input para el siguiente camión
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para determinar el color y el ícono de la alerta visual
  const getConfiguracionVisual = (estado) => {
    switch (estado) {
      case 'A TIEMPO': 
        return { color: 'success', bg: 'bg-success text-white', icono: <CheckCircle size={48} /> };
      case 'ANTICIPADO': 
        return { color: 'info', bg: 'bg-info text-dark', icono: <Info size={48} /> };
      case 'TARDÍO': 
        return { color: 'warning', bg: 'bg-warning text-dark', icono: <AlertTriangle size={48} /> };
      default: 
        return { color: 'danger', bg: 'bg-danger text-white', icono: <XCircle size={48} /> };
    }
  };

  return (
    <div className="container py-3 d-flex justify-content-center align-items-start" style={{ minHeight: '80vh' }}>
      
      {/* Contenedor optimizado para vista móvil (360px) */}
      <div className="col-12 col-md-8 col-lg-5">
        
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-dark text-white p-3 d-flex align-items-center">
            <Clock size={24} className="me-2" />
            <h5 className="mb-0 fw-bold">Registro en Caseta</h5>
          </div>
          
          <div className="card-body p-4">
            <p className="text-muted mb-4 text-center">
              Ingrese el número de pedido del camión para registrar su hora de llegada real.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold">Número de Pedido</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-light"><Search size={20} /></span>
                  <input 
                    type="text" 
                    className="form-control text-uppercase" 
                    placeholder="Ej. PED-001" 
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                disabled={cargando || !numeroPedido}
              >
                {cargando ? 'Procesando...' : 'Registrar Arribo'}
              </button>
            </form>
          </div>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center shadow-sm p-3 border-0 rounded-3">
            <AlertTriangle size={24} className="me-3 flex-shrink-0" />
            <span className="fw-semibold">{error}</span>
          </div>
        )}

        {/* Alerta Visual por Color (Requerimiento HU-02) */}
        {resultado && (
          <div className={`card border-0 shadow-lg text-center ${getConfiguracionVisual(resultado.estado).bg} rounded-4 overflow-hidden transform transition-all`}>
            <div className="card-body p-5">
              <div className="mb-3">
                {getConfiguracionVisual(resultado.estado).icono}
              </div>
              <h2 className="display-6 fw-bold mb-2">
                {resultado.estado}
              </h2>
              <p className="fs-5 mb-0 opacity-75">
                Hora real: {new Date(resultado.fechaHoraLlegadaReal).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}