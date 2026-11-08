'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GestionRoles() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Módulos exigidos por la rúbrica
  const MODULOS_DISPONIBLES = ['usuarios', 'roles', 'proveedores', 'pedidos', 'gateways', 'descargas', 'cola', 'kpis'];

  const [formData, setFormData] = useState({
    _id: '',
    nombreRol: '',
    descripcion: '',
    permisos: []
  });

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRoles(data);
      } else {
        mostrarAlerta(data.msg, 'danger');
      }
    } catch (error) {
      mostrarAlerta('Error al conectar con el servidor', 'danger');
    }
  };

  const mostrarAlerta = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (modulo) => {
    setFormData((prev) => {
      const tienePermiso = prev.permisos.includes(modulo);
      return {
        ...prev,
        permisos: tienePermiso 
          ? prev.permisos.filter(p => p !== modulo) 
          : [...prev.permisos, modulo]
      };
    });
  };

  const abrirFormulario = (rol = null) => {
    if (rol) {
      setIsEditing(true);
      setFormData({
        _id: rol._id,
        nombreRol: rol.nombreRol,
        descripcion: rol.descripcion,
        permisos: rol.permisos
      });
    } else {
      setIsEditing(false);
      setFormData({ _id: '', nombreRol: '', descripcion: '', permisos: [] });
    }
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `http://localhost:4000/api/roles/${formData._id}` 
        : 'http://localhost:4000/api/roles';
      const metodo = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        mostrarAlerta(isEditing ? 'Rol actualizado' : 'Rol creado exitosamente', 'success');
        setMostrarFormulario(false);
        cargarRoles();
      } else {
        mostrarAlerta(data.msg || 'Error al guardar el rol', 'danger');
      }
    } catch (error) {
      mostrarAlerta('Error en la petición', 'danger');
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar este rol?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/roles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        mostrarAlerta('Rol desactivado mediante baja lógica', 'success');
        cargarRoles();
      } else {
        // Aquí se captura el error 403 de Integridad Referencial si el rol está en uso
        mostrarAlerta(data.msg, 'warning');
      }
    } catch (error) {
      mostrarAlerta('Error al desactivar el rol', 'danger');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Catálogo de Roles (RBAC)</h2>
        <button className="btn btn-primary" onClick={() => abrirFormulario()}>
          + Crear Nuevo Rol
        </button>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`} role="alert">
          {mensaje.texto}
        </div>
      )}

      {mostrarFormulario ? (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-dark text-white">
            {isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold">Nombre del Rol</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="nombreRol" 
                  value={formData.nombreRol} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Ej. Auditor Logístico"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Descripción</label>
                <textarea 
                  className="form-control" 
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleInputChange} 
                  required 
                  rows="2"
                ></textarea>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Permisos de Módulos (Acceso)</label>
                <div className="row">
                  {MODULOS_DISPONIBLES.map((modulo) => (
                    <div className="col-md-3 mb-2" key={modulo}>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id={`chk-${modulo}`}
                          checked={formData.permisos.includes(modulo)}
                          onChange={() => handleCheckboxChange(modulo)}
                        />
                        <label className="form-check-label text-capitalize" htmlFor={`chk-${modulo}`}>
                          {modulo}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarFormulario(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Nombre del Rol</th>
                <th>Descripción</th>
                <th>Permisos Habilitados</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((rol) => (
                <tr key={rol._id}>
                  <td className="fw-bold">{rol.nombreRol}</td>
                  <td>{rol.descripcion}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {rol.permisos.map(p => (
                        <span key={p} className="badge bg-info text-dark text-capitalize">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${rol.activo ? 'bg-success' : 'bg-danger'}`}>
                      {rol.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => abrirFormulario(rol)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(rol._id)}>
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">No hay roles registrados o activos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}