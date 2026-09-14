const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    enum: ['administrador', 'coordinador', 'operador'],
    lowercase: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema, 'roles');