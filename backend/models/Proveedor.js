const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
  razonSocial: { type: String, required: true, trim: true },
  identificacionTributaria: { type: String, required: true, unique: true, trim: true },
  categoria: { type: String, required: true, enum: ['construcción', 'general'], lowercase: true },
  contactoNombre: { type: String, required: true, trim: true },
  telefono: { type: String, required: true, trim: true },
  emailContacto: { type: String, required: true, trim: true, lowercase: true },
  
  // Campos de Auditoría y Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true },
  usuarioActualizacion: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});

module.exports = mongoose.model('Proveedor', ProveedorSchema, 'proveedores');