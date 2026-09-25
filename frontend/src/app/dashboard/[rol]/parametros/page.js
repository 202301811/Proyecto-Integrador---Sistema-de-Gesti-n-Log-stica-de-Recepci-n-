"use client";
import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

export default function ParametrosPage() {
  const [parametros, setParametros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [paramActualId, setParamActualId] = useState(null);

  const [formData, setFormData] = useState({
    clave: '',
    valor: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchParametros();
  }, []);

  const fetchParametros = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/parametros', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setParametros(data);
      } else {
        throw new Error(data.mensaje || 'Error al cargar los parámetros');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirModalNuevo = () => {
    setFormData({ clave: '', valor: '', descripcion: '' });
    setModoEdicion(false);
    setError('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (param) => {
    setFormData({
      clave: param.clave,
      valor: param.valor,
      descripcion: param.descripcion
    });
    setParamActualId(param._id);
    setModoEdicion(true);
    setError('');
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const url = modoEdicion 
        ? `http://localhost:4000/api/parametros/${paramActualId}` 
        : 'http://localhost:4000/api/parametros';
      
      const metodo = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al guardar el parámetro');

      setMostrarModal(false);
      fetchParametros();
    } catch (err) {
      setError(err.message);
    }
  };

  // Borrado lógico (Soft Delete)
  const handleEliminar = async (id, clave) => {
    if (window.confirm(`¿Estás seguro de inactivar el parámetro "${clave}"?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/parametros/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al inactivar parámetro');
        fetchParametros();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-flex align-items-center text-dark">
          <Settings className="me-3 text-primary" size={32} />
          Parámetros y Tolerancias del Sistema
        </h2>
        <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={abrirModalNuevo}>
          <Plus size={20} className="me-2" /> Nuevo Parámetro
        </button>
      </div>

      {/* Tabla de Parámetros */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4">Clave</th>
                <th className="py-3">Valor</th>
                <th className="py-3">Descripción</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="4" className="text-center py-5 text-muted">Cargando parámetros...</td></tr>
              ) : parametros.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-5 text-muted">No hay parámetros activos registrados.</td></tr>
              ) : (
                parametros.map(p => (
                  <tr key={p._id}>
                    <td className="px-4 fw-bold font-monospace">{p.clave}</td>
                    <td><span className="badge bg-dark">{p.valor}</span></td>
                    <td className="text-muted">{p.descripcion}</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => abrirModalEditar(p)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(p._id, p.clave)}>
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

      {/* Modal Flotante */}
      {mostrarModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="mb-0 fw-bold">{modoEdicion ? 'Editar Parámetro' : 'Nuevo Parámetro'}</h5>
              <button onClick={() => setMostrarModal(false)} className="btn btn-sm btn-light rounded-circle p-2">
                <X size={20} />
              </button>
            </div>

            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center p-2 mb-3">
                  <AlertTriangle size={20} className="me-2 flex-shrink-0" />
                  <span className="small">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Clave (Identificador único) *</label>
                  <input type="text" className="form-control" name="clave" value={formData.clave} onChange={handleInputChange} placeholder="EJ: TOLERANCIA_TARDIO_MIN" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Valor *</label>
                  <input type="text" className="form-control" name="valor" value={formData.valor} onChange={handleInputChange} placeholder="EJ: 15" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Descripción *</label>
                  <textarea className="form-control" name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3" placeholder="Explica para qué sirve este parámetro..." required></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-light px-4" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}