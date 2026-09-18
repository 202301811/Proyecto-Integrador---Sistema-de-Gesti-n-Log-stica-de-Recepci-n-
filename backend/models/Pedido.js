const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  numeroPedido: {
    type: String,
    required: true,
    unique: true, // Backend: Identificador único de orden[cite: 3]
    trim: true,
  },
  proveedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true, // RN-01: Evita pedidos huérfanos[cite: 3]
  },
  tipoProducto: {
    type: String,
    required: true,
    enum: ['construcción', 'general'], // Backend: Lista cerrada obligatoria[cite: 3]
    lowercase: true,
  },
  fechaHoraProgramada: {
    type: Date,
    required: true,
  },
  inicioVentana: {
    type: Date,
    required: true,
  },
  finVentana: {
    type: Date,
    required: true,
  },
  duracionEstimadaMinutos: {
    type: Number,
    required: true,
    min: 1, // Backend: Duración debe ser mayor a cero[cite: 3]
  },
  estado: {
    type: String,
    required: true,
    default: 'PROGRAMADO', // Estado inicial obligatorio[cite: 3]
    uppercase: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Pedido', PedidoSchema, 'pedidos'); 