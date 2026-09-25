const mongoose = require('mongoose');

const ParametroSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true, trim: true },
  valor: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  
  // Campos de Auditoría y Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true },
  usuarioActualizacion: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});

module.exports = mongoose.model('Parametro', ParametroSchema, 'parametros');