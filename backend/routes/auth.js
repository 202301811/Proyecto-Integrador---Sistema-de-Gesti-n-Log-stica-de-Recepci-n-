const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Ambos modelos registrados para que .populate('roles') funcione
const Role = require('../models/Role');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña requeridos' });
    }

    // Buscar usuario y poblar su relación con la colección roles
    const usuario = await User.findOne({ email: email.toLowerCase().trim() }).populate('roles');
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'Usuario inactivo en el sistema' });
    }

    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // Obtener el nombre del rol asignado
    const rolNombre = usuario.roles && usuario.roles.length > 0 
      ? usuario.roles[0].nombre 
      : 'operador';

    // Payload del JWT con datos de identidad no sensibles
    const payload = {
      id: usuario._id,
      email: usuario.email,
      nombres: usuario.nombres,
      rol: rolNombre,
    };

    // Token firmado con tiempo de expiración de 24 horas
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen', {
      expiresIn: '24h',
    });

    return res.status(200).json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: payload,
    });
  } catch (error) {
    console.error('Error en /login:', error);
    return res.status(500).json({ mensaje: 'Error interno en el servidor' });
  }
});

module.exports = router;