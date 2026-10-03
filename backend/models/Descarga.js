const mongoose = require('mongoose');

const DescargaSchema = new mongoose.Schema({
  gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gateway', required: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
  operadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // ID del operador de descarga
  fechaHoraInicio: { type: Date, required: true },
  fechaHoraFin: { type: Date },
  duracionMinutos: { type: Number },
  
  // Campos de Auditoría y Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true },
  usuarioActualizacion: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});

module.exports = mongoose.model('Descarga', DescargaSchema, 'descargas');