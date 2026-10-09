const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' }, 
  
  // Lista estricta de acciones permitidas (RN-14)
  accion: { 
    type: String, 
    required: true, 
    enum: [
      'LLEGADA_REGISTRADA', 
      'GATEWAY_ASIGNADO', 
      'DESCARGADA_INICIADA', 
      'DESCARGA_FINALIZADA', 
      'CITA_REPROGRAMADA', 
      'GATEWAY_MANTENIMIENTO'
    ] 
  },
  
  // Objeto flexible para guardar qué cambió
  detalles: { type: mongoose.Schema.Types.Mixed }, 
  
  fechaHora: { type: Date, default: Date.now, required: true },

  // Campos de Auditoría & Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true }
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: false }
});

module.exports = mongoose.model('Evento', EventoSchema, 'eventos');