"use client";
import { useState, useEffect, use } from 'react';
import { Truck, CheckCircle, AlertTriangle, Settings, Play } from 'lucide-react';

export default function DashboardPrincipalPage({ params }) {
  const { rol } = use(params);
  const [gateways, setGateways] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados del Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [gatewaySeleccionado, setGatewaySeleccionado] = useState(null);
  const [pedidoIdSeleccionado, setPedidoIdSeleccionado] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      // Cargamos Gateways y Pedidos al mismo tiempo
      const [resGateways, resPedidos] = await Promise.all([
        fetch('http://localhost:4000/api/gateways', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:4000/api/pedidos', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const dataGateways = await resGateways.json();
      const dataPedidos = await resPedidos.json();

      if (resGateways.ok) setGateways(dataGateways);
      if (resPedidos.ok) {
        // Solo mostramos pedidos que están listos para descargarse
        const pedidosPendientes = dataPedidos.filter(p => 
          ['PROGRAMADO', 'A TIEMPO', 'ANTICIPADO', 'TARDÍO', 'EN COLA'].includes(p.estado)
        );
        setPedidos(pedidosPendientes);
      }
    } catch (err) {
      setError('Error de conexión al cargar el tablero de operaciones.');
    } finally {
      setCargando(false);
    }
  };

  // Acción: Mantenimiento (Cambiar estado del Gateway)
  const cambiarEstadoGateway = async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/gateways/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      
      cargarDatos(); // Refresca en tiempo real sin recargar la página
      mostrarExito(`Gateway actualizado a ${nuevoEstado}`);
    } catch (err) { alert(err.message); }
  };

  // Acción: Iniciar Descarga (Abre el Modal)
  const abrirModalDescarga = (gateway) => {
    setGatewaySeleccionado(gateway);
    setPedidoIdSeleccionado('');
    setMostrarModal(true);
  };

  const iniciarDescarga = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/descargas/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ gatewayId: gatewaySeleccionado._id, pedidoId: pedidoIdSeleccionado })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      
      setMostrarModal(false);
      cargarDatos();
      mostrarExito('Carga asignada y descarga iniciada exitosamente.');
    } catch (err) { alert(err.message); }
  };

  // Acción: Finalizar Descarga
  const finalizarDescarga = async (gatewayId) => {
    if(window.confirm('¿Confirma que el desembarque finalizó y la bahía está libre?')) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:4000/api/descargas/finalizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ gatewayId }) 
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.mensaje);
          
          cargarDatos();
          mostrarExito(`Descarga finalizada. Duración: ${data.duracionMinutos} minutos.`);
        } catch (err) { alert(err.message); }
    }
  };

  // Configuración Cromática obligatoria (RN-HU-03)
  const getColorTarjeta = (estado) => {
    if (estado === 'LIBRE') return 'bg-success text-white shadow-lg border-0';
    if (estado === 'OCUPADO') return 'bg-danger text-white shadow-lg border-0';
    return 'bg-secondary text-white shadow opacity-75 border-0'; // FUERA DE SERVICIO
  };

  const getIcono = (estado) => {
    if (estado === 'LIBRE') return <CheckCircle size={48} className="mb-3 opacity-75" />;
    if (estado === 'OCUPADO') return <Truck size={48} className="mb-3" />;
    return <AlertTriangle size={48} className="mb-3 opacity-75" />;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h2 className="fw-bold d-flex align-items-center text-dark">
          <Play className="me-3 text-primary" size={32} /> Tablero de Control de Gateways
        </h2>
      </div>

      {mensajeExito && (
        <div className="alert alert-success fw-bold d-flex align-items-center shadow-sm rounded-3">
          <CheckCircle size={24} className="me-3 flex-shrink-0" /> {mensajeExito}
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Cuadrícula de Gateways */}
      <div className="row g-4">
        {cargando ? (
          <div className="col-12 text-center text-muted py-5">Sincronizando operaciones en tiempo real...</div>
        ) : gateways.length === 0 ? (
          <div className="col-12 text-center text-muted py-5">
            <h4>No hay gateways registrados.</h4>
            <p>Por favor registre la infraestructura (Gateways 1 al 5) en la Base de Datos para iniciar operaciones.</p>
          </div>
        ) : (
          gateways.map(gw => (
            <div key={gw._id} className="col-12 col-md-6 col-lg-4">
              <div className={`card h-100 rounded-4 overflow-hidden transition-all ${getColorTarjeta(gw.estado)}`}>
                
                <div className="card-body p-4 text-center d-flex flex-column justify-content-center">
                  <div className="d-flex justify-content-center">{getIcono(gw.estado)}</div>
                  <h2 className="fw-bold display-6 mb-1">GW {gw.numeroGateway}</h2>
                  <span className="badge bg-light text-dark mt-2 mb-3 align-self-center fs-6 fw-bold shadow-sm">
                    {gw.tipoCargaPermitida.toUpperCase()}
                  </span>
                  <h5 className="fw-bold tracking-wide">{gw.estado}</h5>
                </div>
                
                <div className="card-footer bg-dark bg-opacity-25 border-0 p-3 d-flex flex-column gap-2">
                  {gw.estado === 'LIBRE' && (
                    <>
                      <button className="btn btn-light fw-bold w-100 shadow-sm text-success" onClick={() => abrirModalDescarga(gw)}>
                        <Play size={18} className="me-2"/> Iniciar Descarga
                      </button>
                      <button className="btn btn-outline-light btn-sm w-100" onClick={() => cambiarEstadoGateway(gw._id, 'FUERA DE SERVICIO')}>
                        <Settings size={16} className="me-1"/> Mantenimiento
                      </button>
                    </>
                  )}
                  
                  {gw.estado === 'OCUPADO' && (
                    <button className="btn btn-dark fw-bold w-100 shadow-sm border border-light" onClick={() => finalizarDescarga(gw._id)}>
                      <CheckCircle size={18} className="me-2 text-info"/> Finalizar Descarga
                    </button>
                  )}
                  
                  {gw.estado === 'FUERA DE SERVICIO' && (
                    <button className="btn btn-light fw-bold w-100 shadow-sm text-secondary" onClick={() => cambiarEstadoGateway(gw._id, 'LIBRE')}>
                      <CheckCircle size={18} className="me-2"/> Habilitar Gateway
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Asignar Carga */}
      {mostrarModal && gatewaySeleccionado && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header bg-dark text-white p-4">
              <h5 className="mb-0 fw-bold">Asignar Carga - Gateway {gatewaySeleccionado.numeroGateway}</h5>
              <div className="text-info mt-1 small">Exclusividad: {gatewaySeleccionado.tipoCargaPermitida.toUpperCase()}</div>
            </div>
            <div className="card-body p-4">
              <form onSubmit={iniciarDescarga}>
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary">Seleccionar Camión en Patio</label>
                  <select 
                    className="form-select form-select-lg shadow-sm border-0 bg-light" 
                    value={pedidoIdSeleccionado} 
                    onChange={(e) => setPedidoIdSeleccionado(e.target.value)} 
                    required
                  >
                    <option value="">-- Seleccione un pedido compatible --</option>
                    {pedidos
                      // Ayuda visual: Filtramos para mostrar solo los camiones que coinciden con el Gateway
                      .filter(p => p.tipoProducto === gatewaySeleccionado.tipoCargaPermitida)
                      .map(p => (
                        <option key={p._id} value={p._id}>
                          {p.numeroPedido} - (Estado: {p.estado})
                        </option>
                    ))}
                  </select>
                  
                  {pedidos.filter(p => p.tipoProducto === gatewaySeleccionado.tipoCargaPermitida).length === 0 && (
                    <div className="alert alert-warning mt-3 small p-2">
                      <AlertTriangle size={16} className="me-2"/>
                      No hay camiones de tipo "{gatewaySeleccionado.tipoCargaPermitida}" en espera.
                    </div>
                  )}
                </div>
                
                <div className="d-flex justify-content-end gap-2 border-top pt-3">
                  <button type="button" className="btn btn-light px-4" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={!pedidoIdSeleccionado}>Asignar e Iniciar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}