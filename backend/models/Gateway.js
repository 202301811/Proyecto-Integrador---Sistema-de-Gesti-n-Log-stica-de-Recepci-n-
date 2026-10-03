const mongoose = require('mongoose');

const GatewaySchema = new mongoose.Schema({
  numeroGateway: { type: Number, required: true, unique: true, min: 1, max: 5 },
  tipoCargaPermitida: { type: String, required: true, enum: ['general', 'construcción'], lowercase: true },
  estado: { 
    type: String, 
    required: true, 
    enum: ['LIBRE', 'OCUPADO', 'FUERA DE SERVICIO'], 
    default: 'LIBRE', 
    uppercase: true 
  },
  
  // Campos de Auditoría y Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true },
  usuarioActualizacion: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});

module.exports = mongoose.model('Gateway', GatewaySchema, 'gateways');