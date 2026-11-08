const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nombres: {
    type: String,
    required: true,
    trim: true,
  },
  apellidosCompleto: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Consumo dinámico de roles (RBAC) - Sprint 7
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  }],
  // Estandarización de Soft Delete requerida en Sprint 7
  activo: {
    type: Boolean,
    default: true,
  },

  // Campos para Sprint 5: MFA y Gobernanza 
  mfaObligatorio: { 
    type: Boolean, 
    default: false 
  },
  twoFactorSecret: { 
    type: String, 
    select: false // Oculto por defecto por seguridad
  },
  twoFactorEnabled: { 
    type: Boolean, 
    default: false 
  },
  twoFactorRecoveryCodes: { 
    type: [String], 
    select: false // Códigos de respaldo ocultos
  },

  // Campos de Auditoría & Control - Sprint 7
  usuarioCreacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia a la misma colección
    default: null
  },
  usuarioActualizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { 
  // Mapeo de timestamps exigido en la rúbrica
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } 
});


UserSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return; 
    }
    const bcrypt = require('bcrypt'); // Cambia a 'bcrypt' si usas esa
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar la contraseña ingresada con el hash
UserSchema.methods.compararPassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('User', UserSchema, 'usuarios');