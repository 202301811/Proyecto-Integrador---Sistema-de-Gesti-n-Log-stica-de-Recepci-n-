const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' }, 
  
  // Lista estricta de acciones permitidas (RN-14 actualizadas para Sprint 6)
  accion: { 
    type: String, 
    required: true, 
    enum: [
      // Eventos anteriores (Sprints pasados)
      'LLEGADA_REGISTRADA', 
      'GATEWAY_ASIGNADO', 
      'DESCARGADA_INICIADA', 
      'DESCARGA_FINALIZADA', 
      'CITA_REPROGRAMADA', 
      'GATEWAY_MANTENIMIENTO',
      // Nuevos eventos inmutables del Sprint 6 (Manejo de Cola)
      'INGRESO_COLA', 
      'AGING_APLICADO', 
      'PROMOCION_AUTOMATICA_GATEWAY'
    ] 
  },
  
  // Objeto flexible para guardar qué cambió
  detalles: { type: mongoose.Schema.Types.Mixed }, 
  
  fechaHora: { type: Date, default: Date.now, required: true },

  // Campos de Auditoría & Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true }
}, {
  // RN-14 exige registros inmutables, por lo que bloqueamos updatedAt
  timestamps: { createdAt: 'fechaCreacion', updatedAt: false }
});

module.exports = mongoose.model('Evento', EventoSchema, 'eventos');