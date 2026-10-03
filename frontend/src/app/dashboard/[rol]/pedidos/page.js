"use client";
import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, X, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [alternativas, setAlternativas] = useState([]);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [pedidoActualId, setPedidoActualId] = useState(null);
  
  const [formData, setFormData] = useState({
    numeroPedido: '', proveedorId: '', tipoProducto: 'general',
    fechaHoraProgramada: '', duracionEstimadaMinutos: 30
  });

  useEffect(() => { fetchPedidos(); fetchProveedores(); }, []);

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const fetchPedidos = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/pedidos', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setPedidos(data);
      else throw new Error(data.mensaje || 'Error al cargar pedidos');
    } catch (err) { setError(err.message); } finally { setCargando(false); }
  };

  const fetchProveedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/proveedores', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setProveedores(data);
    } catch (err) { console.error('Error al cargar proveedores:', err); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const abrirModalNuevo = () => {
    setFormData({ numeroPedido: '', proveedorId: '', tipoProducto: 'general', fechaHoraProgramada: '', duracionEstimadaMinutos: 30 });
    setModoEdicion(false);
    setError(''); setAlternativas([]); setMostrarModal(true);
  };

  const abrirModalEditar = (pedido) => {
    const fecha = new Date(pedido.fechaHoraProgramada);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(fecha - tzoffset)).toISOString().slice(0, 16);

    setFormData({
      numeroPedido: pedido.numeroPedido, proveedorId: pedido.proveedorId._id,
      tipoProducto: pedido.tipoProducto, fechaHoraProgramada: localISOTime,
      duracionEstimadaMinutos: pedido.duracionEstimadaMinutos
    });
    setPedidoActualId(pedido._id);
    setModoEdicion(true);
    setError(''); setAlternativas([]); setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setAlternativas([]);
    try {
      const token = localStorage.getItem('token');
      const url = modoEdicion ? `http://localhost:4000/api/pedidos/${pedidoActualId}` : 'http://localhost:4000/api/pedidos';
      const metodo = modoEdicion ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      payload.fechaHoraProgramada = new Date(formData.fechaHoraProgramada).toISOString();

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409 && data.alternativasDisponibles) setAlternativas(data.alternativasDisponibles);
        throw new Error(data.mensaje || 'Error al guardar el pedido');
      }
      
      setMostrarModal(false);
      fetchPedidos();
      mostrarExito(modoEdicion ? 'Cita reprogramada exitosamente.' : 'Cita agendada exitosamente.');
    } catch (err) { setError(err.message); }
  };

  const handleCancelar = async (id, numero) => {
    if (window.confirm(`¿Estás seguro de cancelar el pedido "${numero}"?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/pedidos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al cancelar el pedido');
        fetchPedidos();
        mostrarExito(`El pedido ${numero} fue cancelado correctamente.`);
      } catch (err) { alert(err.message); }
    }
  };

  const getBadgeColor = (estado) => {
    switch(estado) {
        case 'PROGRAMADO': return 'bg-primary';
        case 'A TIEMPO': return 'bg-success';
        case 'ANTICIPADO': return 'bg-info text-dark';
        case 'TARDÍO': return 'bg-warning text-dark';
        case 'CANCELADO': return 'bg-danger';
        case 'EN COLA': return 'bg-secondary text-white';
        case 'DESCARGANDO': return 'bg-warning text-dark border border-warning shadow-sm';
        case 'FINALIZADO': return 'bg-dark text-white shadow-sm';
        default: return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-flex align-items-center text-dark">
          <Calendar className="me-3 text-primary" size={32} /> Programación de Citas
        </h2>
        <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={abrirModalNuevo}>
          <Plus size={20} className="me-2" /> Nueva Cita
        </button>
      </div>

      {mensajeExito && (
        <div className="alert alert-success d-flex align-items-center mb-4 shadow-sm border-0 rounded-3">
          <CheckCircle size={24} className="me-3 flex-shrink-0" />
          <span className="fw-semibold">{mensajeExito}</span>
        </div>
      )}

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4">N° Pedido</th><th className="py-3">Proveedor</th>
                <th className="py-3">Fecha y Hora</th><th className="py-3">Estado</th><th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Cargando citas...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No hay citas programadas.</td></tr>
              ) : (
                pedidos.map(p => (
                  <tr key={p._id}>
                    <td className="px-4 fw-bold text-uppercase">{p.numeroPedido}</td>
                    <td><div className="fw-semibold">{p.proveedorId?.razonSocial || 'Desconocido'}</div><div className="small text-muted text-uppercase">{p.tipoProducto}</div></td>
                    <td><div className="d-flex align-items-center"><Clock size={16} className="me-2 text-secondary" />{new Date(p.fechaHoraProgramada).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })}</div></td>
                    <td><span className={`badge ${getBadgeColor(p.estado)}`}>{p.estado}</span></td>
                    <td className="text-center">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2" 
                        onClick={() => abrirModalEditar(p)} 
                        disabled={['CANCELADO', 'DESCARGANDO', 'FINALIZADO'].includes(p.estado)}
                        title={['DESCARGANDO', 'FINALIZADO'].includes(p.estado) ? "No se puede editar una operación en curso o finalizada" : "Reprogramar Cita"}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleCancelar(p._id, p.numeroPedido)} 
                        disabled={['CANCELADO', 'DESCARGANDO', 'FINALIZADO'].includes(p.estado)}
                        title={['DESCARGANDO', 'FINALIZADO'].includes(p.estado) ? "No se puede cancelar una operación en curso o finalizada" : "Cancelar Cita"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="mb-0 fw-bold">{modoEdicion ? 'Reprogramar Cita' : 'Programar Nueva Cita'}</h5>
              <button onClick={() => setMostrarModal(false)} className="btn btn-sm btn-light rounded-circle p-2"><X size={20} /></button>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger p-3 mb-4 rounded-3 border-0 shadow-sm">
                  <div className="d-flex align-items-center mb-2"><AlertTriangle size={20} className="me-2 flex-shrink-0" /><span className="fw-bold">Error de Validación</span></div>
                  <div className="small">{error}</div>
                  {alternativas.length > 0 && (
                    <div className="mt-3 pt-3 border-top border-danger border-opacity-25">
                      <p className="fw-semibold mb-2">Ventanas alternativas sugeridas:</p>
                      <ul className="mb-0 small">{alternativas.map((alt, idx) => (<li key={idx} className="mb-1">{new Date(alt.fechaHoraSugerida).toLocaleString('es-SV', { dateStyle: 'full', timeStyle: 'short' })}</li>))}</ul>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold small">Número de Pedido *</label>
                    <input 
                      type="text" 
                      className="form-control text-uppercase bg-light" 
                      name="numeroPedido" 
                      value={modoEdicion ? formData.numeroPedido : 'AUTOGENERADO'} 
                      disabled 
                    />
                    {!modoEdicion && (
                      <small className="text-muted d-block mt-1">
                        El código correlativo se generará automáticamente al guardar.
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3"><label className="form-label fw-semibold small">Tipo de Producto *</label><select className="form-select" name="tipoProducto" value={formData.tipoProducto} onChange={handleInputChange} required disabled={modoEdicion}><option value="general">General</option><option value="construcción">Construcción</option></select></div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold small">Proveedor *</label>
                    <select className="form-select" name="proveedorId" value={formData.proveedorId} onChange={handleInputChange} required disabled={modoEdicion}>
                      <option value="">-- Seleccione un Proveedor --</option>
                      {proveedores.map(p => (<option key={p._id} value={p._id}>{p.razonSocial} (NIT: {p.identificacionTributaria})</option>))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3"><label className="form-label fw-semibold small">Fecha y Hora de la Cita *</label><input type="datetime-local" className="form-control" name="fechaHoraProgramada" value={formData.fechaHoraProgramada} onChange={handleInputChange} required /></div>
                  <div className="col-md-6 mb-3"><label className="form-label fw-semibold small">Duración (Minutos) *</label><input type="number" className="form-control" name="duracionEstimadaMinutos" value={formData.duracionEstimadaMinutos} onChange={handleInputChange} min="1" required /></div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                  <button type="button" className="btn btn-light px-4" onClick={() => setMostrarModal(false)}>Cerrar</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">{modoEdicion ? 'Guardar Cambios' : 'Agendar Cita'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}