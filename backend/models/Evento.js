const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' }, 
  
  // Lista estricta de acciones permitidas 
  accion: { 
    type: String, 
    required: true, 
    enum: [
      'LLEGADA_REGISTRADA', 
      'GATEWAY_ASIGNADO', 
      'DESCARGADA_INICIADA', 
      'DESCARGA_FINALIZADA', 
      'CITA_REPROGRAMADA', 
      'GATEWAY_MANTENIMIENTO',
      'INGRESO_COLA', 
      'AGING_APLICADO', 
      'PROMOCION_AUTOMATICA_GATEWAY',
      'ROL_CREADO',
      'ROL_MODIFICADO',
      'ROL_DESACTIVADO',
      'USUARIO_CREADO',
      'USUARIO_MODIFICADO',
      'USUARIO_ELIMINADO'
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