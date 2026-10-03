"use client";
import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [provActualId, setProvActualId] = useState(null);
  
  const [formData, setFormData] = useState({
    razonSocial: '', identificacionTributaria: '', categoria: 'general',
    contactoNombre: '', telefono: '', emailContacto: ''
  });

  useEffect(() => { fetchProveedores(); }, []);

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const fetchProveedores = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/proveedores', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setProveedores(data);
      else throw new Error(data.mensaje || 'Error al cargar proveedores');
    } catch (err) { setError(err.message); } finally { setCargando(false); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const abrirModalNuevo = () => {
    setFormData({ razonSocial: '', identificacionTributaria: '', categoria: 'general', contactoNombre: '', telefono: '', emailContacto: '' });
    setModoEdicion(false);
    setError('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (prov) => {
    setFormData({
      razonSocial: prov.razonSocial, identificacionTributaria: prov.identificacionTributaria,
      categoria: prov.categoria, contactoNombre: prov.contactoNombre,
      telefono: prov.telefono, emailContacto: prov.emailContacto
    });
    setProvActualId(prov._id);
    setModoEdicion(true);
    setError('');
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const url = modoEdicion ? `http://localhost:4000/api/proveedores/${provActualId}` : 'http://localhost:4000/api/proveedores';
      const metodo = modoEdicion ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.errores) throw new Error(data.errores.map(err => err.msg).join(', '));
        throw new Error(data.mensaje || 'Error al guardar el proveedor');
      }
      
      setMostrarModal(false);
      fetchProveedores();
      mostrarExito(modoEdicion ? 'Proveedor actualizado exitosamente.' : 'Proveedor registrado exitosamente.');
    } catch (err) { setError(err.message); }
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de inactivar al proveedor "${nombre}"?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/proveedores/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al inactivar proveedor');
        fetchProveedores();
        mostrarExito(`El proveedor ${nombre} fue inactivado correctamente.`);
      } catch (err) { alert(err.message); }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-flex align-items-center text-dark">
          <Truck className="me-3 text-primary" size={32} />
          Mantenimiento de Proveedores
        </h2>
        <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={abrirModalNuevo}>
          <Plus size={20} className="me-2" /> Nuevo Proveedor
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
                <th className="py-3 px-4">Razón Social</th>
                <th className="py-3">NIT</th>
                <th className="py-3">Categoría</th>
                <th className="py-3">Contacto</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Cargando proveedores...</td></tr>
              ) : proveedores.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No hay proveedores activos registrados.</td></tr>
              ) : (
                proveedores.map(p => (
                  <tr key={p._id}>
                    <td className="px-4 fw-bold">{p.razonSocial}</td>
                    <td className="font-monospace text-muted">{p.identificacionTributaria}</td>
                    <td>
                      <span className={`badge ${p.categoria === 'construcción' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {p.categoria.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="small fw-semibold">{p.contactoNombre}</div>
                      <div className="small text-muted">{p.telefono}</div>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => abrirModalEditar(p)} title="Editar Proveedor">
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(p._id, p.razonSocial)} title="Inactivar Proveedor">
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
              <h5 className="mb-0 fw-bold">{modoEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h5>
              <button onClick={() => setMostrarModal(false)} className="btn btn-sm btn-light rounded-circle p-2"><X size={20} /></button>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center p-2 mb-3">
                  <AlertTriangle size={20} className="me-2 flex-shrink-0" />
                  <span className="small">{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold small">Razón Social *</label>
                    <input type="text" className="form-control" name="razonSocial" value={formData.razonSocial} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold small">NIT (Identificación) *</label>
                    <input type="text" className="form-control" name="identificacionTributaria" value={formData.identificacionTributaria} onChange={handleInputChange} required disabled={modoEdicion} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold small">Categoría *</label>
                    <select className="form-select" name="categoria" value={formData.categoria} onChange={handleInputChange} required>
                      <option value="general">General</option>
                      <option value="construcción">Construcción</option>
                    </select>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold small">Nombre del Contacto *</label>
                    <input type="text" className="form-control" name="contactoNombre" value={formData.contactoNombre} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold small">Teléfono *</label>
                    <input type="text" className="form-control" name="telefono" value={formData.telefono} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold small">Email de Contacto *</label>
                    <input type="email" className="form-control" name="emailContacto" value={formData.emailContacto} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                  <button type="button" className="btn btn-light px-4" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">{modoEdicion ? 'Actualizar Datos' : 'Guardar Proveedor'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}