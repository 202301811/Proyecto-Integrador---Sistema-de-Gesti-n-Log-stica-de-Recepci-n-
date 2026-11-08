const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  nombreRol: {
    type: String,
    required: [true, 'El nombre del rol es obligatorio'],
    unique: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
  },
  permisos: [{
    type: String,
    enum: ['usuarios', 'roles', 'proveedores', 'pedidos', 'gateways', 'descargas', 'cola', 'kpis'],
  }],
  activo: {
    type: Boolean,
    default: true
  },
  // Campos de Auditoría & Control
  usuarioCreacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usuarioActualizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { 
  // Mapeamos los timestamps automáticos de Mongoose a los nombres que exige la rúbrica
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});

module.exports = mongoose.model('Role', RoleSchema, 'roles');