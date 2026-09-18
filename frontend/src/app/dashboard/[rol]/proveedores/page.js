"use client";
import { useState } from 'react';

export default function RegistroProveedorPage() {
  // Formulario controlado mediante estados en React
  const [formData, setFormData] = useState({
    razonSocial: '',
    identificacionTributaria: '',
    emailContacto: '',
    categoria: 'general', // Valor por defecto válido
    contactoNombre: '',
    telefono: ''
  });
  
  const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

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

    try {
      // Consumo de endpoint asíncrono sin recargar la página
      const res = await fetch('http://localhost:4000/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Formatear los errores que envía express-validator desde el backend
        const textoError = data.errores 
            ? data.errores.map(err => err.msg).join(' | ') 
            : data.mensaje;
        throw new Error(textoError || 'Error al guardar el proveedor');
      }

      setAlerta({ mensaje: '¡Proveedor registrado exitosamente!', tipo: 'success' });
      
      // Limpiar formulario tras éxito
      setFormData({
        razonSocial: '',
        identificacionTributaria: '',
        emailContacto: '',
        categoria: 'general',
        contactoNombre: '',
        telefono: ''
      });

    } catch (error) {
      setAlerta({ mensaje: error.message, tipo: 'danger' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm border-0 col-12 col-lg-8 mx-auto">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Registro de Proveedor (Transportista)</h4>
        </div>
        <div className="card-body p-4">
          
          {alerta.mensaje && (
            <div className={`alert alert-${alerta.tipo}`} role="alert">
              {alerta.mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Razón Social</label>
                <input type="text" name="razonSocial" className="form-control" value={formData.razonSocial} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Identificación Tributaria (NIT/RUT)</label>
                <input type="text" name="identificacionTributaria" className="form-control" value={formData.identificacionTributaria} onChange={handleChange} required />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nombre de Contacto</label>
                <input type="text" name="contactoNombre" className="form-control" value={formData.contactoNombre} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Teléfono</label>
                <input type="text" name="telefono" className="form-control" value={formData.telefono} onChange={handleChange} required />
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Correo Electrónico</label>
                <input type="email" name="emailContacto" className="form-control" value={formData.emailContacto} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Categoría de Carga</label>
                {/* Lista desplegable controlada obligatoria[cite: 3] */}
                <select name="categoria" className="form-select" value={formData.categoria} onChange={handleChange} required>
                  <option value="general">General</option>
                  <option value="construcción">Construcción</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary px-4" disabled={cargando}>
                {cargando ? 'Guardando...' : 'Registrar Proveedor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}