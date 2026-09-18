const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
  razonSocial: {
    type: String,
    required: true,
    trim: true,
  },
  identificacionTributaria: {
    type: String,
    required: true,
    unique: true, // Backend: Evita proveedores duplicados
    trim: true,
  },
  categoria: {
    type: String,
    required: true,
    enum: ['construcción', 'general'], // Backend: Lista cerrada obligatoria
    lowercase: true,
  },
  contactoNombre: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
  },
  emailContacto: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  estado: {
    type: String,
    default: 'activo',
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Proveedor', ProveedorSchema, 'proveedores');