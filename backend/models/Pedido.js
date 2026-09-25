const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  numeroPedido: { type: String, required: true, unique: true, trim: true },
  proveedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
  tipoProducto: { type: String, required: true, enum: ['construcción', 'general'], lowercase: true },
  fechaHoraProgramada: { type: Date, required: true },
  inicioVentana: { type: Date, required: true },
  finVentana: { type: Date, required: true },
  duracionEstimadaMinutos: { type: Number, required: true, min: 1 },
  
  // Nuevo campo para el control de arribos (HU-02)
  fechaHoraLlegadaReal: { type: Date },
  
  estado: {
    type: String,
    required: true,
    enum: ['PROGRAMADO', 'ANTICIPADO', 'A TIEMPO', 'TARDÍO', 'AUSENTE', 'CANCELADO'],
    default: 'PROGRAMADO',
    uppercase: true
  },
  
  // Campos de Auditoría y Soft Delete
  activo: { type: Boolean, default: true },
  usuarioCreacion: { type: String, required: true },
  usuarioActualizacion: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});

module.exports = mongoose.model('Pedido', PedidoSchema, 'pedidos');