"use client";
import { useState, useEffect, use } from 'react';
import { Users, Plus, Edit, Trash2, ShieldAlert, X, Save, CheckCircle } from 'lucide-react';

export default function GestiónUsuariosPage({ params }) {
  const { rol } = use(params);
  
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  // 1. Nuevo estado para manejar los mensajes de éxito
  const [mensajeExito, setMensajeExito] = useState(''); 

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    rol: 'operador',
    mfaObligatorio: false
  });

  useEffect(() => {
    if (rol === 'administrador') {
      cargarUsuarios();
    }
  }, [rol]);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setCargando(false);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    
    try {
      const token = localStorage.getItem('token');
      const url = editandoId 
        ? `http://localhost:4000/api/usuarios/${editandoId}` 
        : 'http://localhost:4000/api/usuarios';
        
      const metodo = editandoId ? 'PUT' : 'POST';

      const partesNombre = formData.nombreCompleto.trim().split(' ');
      const nombresEnviados = partesNombre[0] || 'Usuario';
      const apellidosEnviados = partesNombre.slice(1).join(' ') || 'Demo';

      const payload = {
        ...formData,
        nombres: nombresEnviados,
        apellidosCompleto: apellidosEnviados
      };

      const res = await fetch(url, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.mensaje || 'Error al guardar el usuario');

      // 2. Disparar el mensaje de éxito correcto según la acción
      setMensajeExito(editandoId ? 'Usuario modificado correctamente' : 'Usuario creado exitosamente');
      
      setMostrarFormulario(false);
      setEditandoId(null);
      resetForm();
      cargarUsuarios();
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(''), 3000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  const editarUsuario = (usuario) => {
    setError('');
    setMensajeExito('');
    setFormData({
      nombreCompleto: usuario.nombreCompleto || usuario.nombres || '',
      email: usuario.email || '',
      password: '', // Se deja en blanco para que el admin escriba una nueva si lo desea
      rol: usuario.roles && usuario.roles.length > 0 ? usuario.roles[0].nombre : 'operador',
      mfaObligatorio: usuario.mfaObligatorio || false
    });
    setEditandoId(usuario._id);
    setMostrarFormulario(true);
  };

  const eliminarUsuario = async (id) => {
    setError('');
    setMensajeExito('');
    // 3. Modificamos la alerta de confirmación
    if (!window.confirm('¿Estás seguro de eliminar este usuario del sistema?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMensajeExito('Usuario eliminado correctamente');
      cargarUsuarios();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error("Error al eliminar:", error);
      setError('Error al intentar eliminar el usuario');
    }
  };

  const resetForm = () => {
    setFormData({ nombreCompleto: '', email: '', password: '', rol: 'operador', mfaObligatorio: false });
    setEditandoId(null);
  };

  if (rol !== 'administrador') {
    return (
      <div className="container-fluid py-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <ShieldAlert size={80} className="text-danger mb-4" />
        <h2 className="fw-bold text-dark">Acceso Restringido</h2>
        <p className="text-muted fs-5">La gobernanza de usuarios es exclusiva para el Administrador del Sistema.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h2 className="fw-bold d-flex align-items-center text-dark">
          <Users className="me-3 text-primary" size={32} /> 
          Gestión de Usuarios y Accesos
        </h2>
        {!mostrarFormulario && (
          <button className="btn btn-primary d-flex align-items-center" onClick={() => setMostrarFormulario(true)}>
            <Plus size={20} className="me-2" /> Nuevo Usuario
          </button>
        )}
      </div>

      {/* Renderizado de las alertas rojas y verdes */}
      {error && <div className="alert alert-danger">{error}</div>}
      {mensajeExito && (
        <div className="alert alert-success d-flex align-items-center">
          <CheckCircle size={20} className="me-2" />
          {mensajeExito}
        </div>
      )}

      {mostrarFormulario ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">{editandoId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h5>
            <button className="btn btn-light btn-sm" onClick={() => { setMostrarFormulario(false); resetForm(); }}>
              <X size={20} />
            </button>
          </div>
          <div className="card-body p-4">
            <form onSubmit={manejarEnvio}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nombre Completo</label>
                  <input type="text" className="form-control" value={formData.nombreCompleto} onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Correo Electrónico</label>
                  <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Contraseña {editandoId && <span className="text-muted small fw-normal">(Dejar en blanco para no cambiar)</span>}
                  </label>
                  {/* 4. El required solo aplica si NO estamos editando (editandoId es null) */}
                  <input 
                    type="password" 
                    className="form-control" 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    required={!editandoId} 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Rol del Sistema</label>
                  <select className="form-select" value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})}>
                    <option value="operador">Operador</option>
                    <option value="coordinador">Coordinador Logístico</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                
                <div className="col-12">
                  <div className="form-check form-switch mb-3 mt-3 p-3 border rounded bg-light border-primary border-opacity-25">
                    <input
                      className="form-check-input ms-0 me-2"
                      type="checkbox"
                      id="mfaObligatorio"
                      name="mfaObligatorio"
                      role="switch"
                      style={{ cursor: 'pointer', width: '40px', height: '20px' }}
                      checked={formData.mfaObligatorio || false}
                      onChange={(e) => setFormData({ ...formData, mfaObligatorio: e.target.checked })}
                    />
                    <label className="form-check-label fw-bold text-dark ms-2" htmlFor="mfaObligatorio" style={{ cursor: 'pointer' }}>
                      Requerir Autenticación Multifactor (MFA)
                    </label>
                    <div className="form-text text-muted small mt-1 ms-2">
                      Al activar esta opción, el usuario estará obligado a enrolarse con Google Authenticator en su próximo inicio de sesión.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary d-flex align-items-center">
                  <Save size={20} className="me-2" /> {editandoId ? 'Guardar Cambios' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-0">
            {cargando ? (
              <div className="text-center p-5 text-muted">Cargando usuarios...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="py-3">Correo</th>
                      <th className="py-3">Rol</th>
                      <th className="py-3 text-center">MFA Exigido</th>
                      <th className="py-3 text-end px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No hay usuarios registrados</td></tr>
                    ) : (
                      usuarios.map(user => (
                        <tr key={user._id}>
                          <td className="px-4 fw-medium">{user.nombreCompleto || user.nombres}</td>
                          <td>{user.email}</td>
                          <td><span className="badge bg-secondary text-uppercase">{user.roles && user.roles[0]?.nombre}</span></td>
                          <td className="text-center">
                            {user.mfaObligatorio ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success">Obligatorio</span>
                            ) : (
                              <span className="text-muted small">Opcional</span>
                            )}
                          </td>
                          <td className="text-end px-4">
                            <button className="btn btn-outline-primary btn-sm me-2" onClick={() => editarUsuario(user)}>
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarUsuario(user._id)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}