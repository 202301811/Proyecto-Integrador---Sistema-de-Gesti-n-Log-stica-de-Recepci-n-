"use client";
import { useState, useEffect } from 'react';

export default function AgendarPedidoPage() {
  const [formData, setFormData] = useState({
    numeroPedido: '',
    proveedorId: '', 
    tipoProducto: 'general', // Restringido a 'construcción' o 'general'
    fechaHoraProgramada: '',
    duracionEstimadaMinutos: '' // Obligatorio y mayor a cero
  });
  
  const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' });
  const [alternativas, setAlternativas] = useState([]); // RN-02[cite: 3]
  const [cargando, setCargando] = useState(false);
  
  // Estado para almacenar la lista de pedidos obtenidos del GET
  const [pedidosRegistrados, setPedidosRegistrados] = useState([]);

  // Función para consumir GET /api/pedidos
  const cargarPedidos = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/pedidos');
      if (res.ok) {
        const data = await res.json();
        setPedidosRegistrados(data);
      }
    } catch (error) {
      console.error('Error al cargar la lista de pedidos:', error);
    }
  };

  //  Ejecutar la carga de pedidos al entrar a la pantalla
  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setAlerta({ mensaje: '', tipo: '' });
    setAlternativas([]); 

    try {
      // Consumo asíncrono de POST /api/pedidos[cite: 3]
      const res = await fetch('http://localhost:4000/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duracionEstimadaMinutos: Number(formData.duracionEstimadaMinutos)
        }),
      });

      const data = await res.json();

      // RN-02: Detección de solapamiento (Error 409)[cite: 3]
      if (res.status === 409) {
        setAlerta({ mensaje: data.mensaje, tipo: 'warning' });
        setAlternativas(data.alternativasDisponibles || []);
        return;
      }

      if (!res.ok) {
        const textoError = data.errores 
            ? data.errores.map(err => err.msg).join(' | ') 
            : data.mensaje;
        throw new Error(textoError || 'Error al programar el pedido');
      }

      setAlerta({ mensaje: '¡Pedido programado exitosamente con estado PROGRAMADO!', tipo: 'success' });
      
      setFormData({
        numeroPedido: '',
        proveedorId: '',
        tipoProducto: 'general',
        fechaHoraProgramada: '',
        duracionEstimadaMinutos: ''
      });

      // Recargar la tabla automáticamente sin refrescar la página[cite: 3]
      cargarPedidos();

    } catch (error) {
      setAlerta({ mensaje: error.message, tipo: 'danger' });
    } finally {
      setCargando(false);
    }
  };

  // Función auxiliar para formatear la fecha a un formato legible
  const formatearFecha = (fechaISO) => {
    return new Date(fechaISO).toLocaleString('es-SV', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="container py-5">
      {/* Formulario de Registro */}
      <div className="card shadow-sm border-0 col-12 col-lg-8 mx-auto mb-5">
        <div className="card-header bg-success text-white">
          <h4 className="mb-0">Programación de Pedidos (Citas)</h4>
        </div>
        <div className="card-body p-4">
          
          {alerta.mensaje && (
            <div className={`alert alert-${alerta.tipo}`} role="alert">
              <strong>{alerta.mensaje}</strong>
              
              {/* Renderizado de alternativas (RN-02)[cite: 3] */}
              {alternativas.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2">Ventanas disponibles sugeridas dentro del horario logístico:</p>
                  <ul className="list-group">
                    {alternativas.map((alt, index) => (
                      <li key={index} className="list-group-item list-group-item-warning d-flex justify-content-between align-items-center">
                        <span>
                          <strong>Opción {index + 1}:</strong> {formatearFecha(alt.fechaHoraSugerida)} 
                          <i className="mx-2">hasta</i> {formatearFecha(alt.finVentanaSugerida)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Número de Pedido</label>
                <input type="text" name="numeroPedido" className="form-control" value={formData.numeroPedido} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">ID del Proveedor (RN-01)</label>
                <input type="text" name="proveedorId" className="form-control" placeholder="Pegar _id de MongoDB Compass" value={formData.proveedorId} onChange={handleChange} required />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Tipo de Producto</label>
                <select name="tipoProducto" className="form-select" value={formData.tipoProducto} onChange={handleChange} required>
                  <option value="general">General</option>
                  <option value="construcción">Construcción</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Duración Estimada (Minutos)</label>
                <input type="number" min="1" name="duracionEstimadaMinutos" className="form-control" value={formData.duracionEstimadaMinutos} onChange={handleChange} required />
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label fw-semibold">Fecha y Hora Programada</label>
                <input type="datetime-local" name="fechaHoraProgramada" className="form-control" value={formData.fechaHoraProgramada} onChange={handleChange} required />
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-success px-4" disabled={cargando}>
                {cargando ? 'Validando horario...' : 'Agendar Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* NUEVO: Tabla de Pedidos Programados consumiendo el GET[cite: 3] */}
      <div className="card shadow-sm border-0 col-12 mx-auto">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">Control de Ventanas Horarias Asignadas</h5>
        </div>
        <div className="card-body p-0 table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th># Pedido</th>
                <th>Razón Social (Proveedor)</th>
                <th>Carga</th>
                <th>Inicio de Ventana</th>
                <th>Fin de Ventana</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidosRegistrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No hay pedidos programados aún.</td>
                </tr>
              ) : (
                pedidosRegistrados.map((pedido) => (
                  <tr key={pedido._id}>
                    <td className="fw-bold">{pedido.numeroPedido}</td>
                    {/* El populate de mongoose nos permite mostrar el nombre en lugar del ID */}
                    <td>{pedido.proveedorId?.razonSocial || 'Proveedor no encontrado'}</td>
                    <td className="text-capitalize">{pedido.tipoProducto}</td>
                    <td>{formatearFecha(pedido.inicioVentana)}</td>
                    <td>{formatearFecha(pedido.finVentana)}</td>
                    <td><span className="badge bg-primary">{pedido.estado}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}