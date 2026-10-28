const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// GET /api/usuarios - Obtener todos los usuarios activos
router.get('/', usuarioController.obtenerUsuarios);

// POST /api/usuarios - Crear nuevo usuario
router.post('/', usuarioController.crearUsuario);

// PUT /api/usuarios/:id - Actualizar usuario existente (incluyendo el switch MFA)
router.put('/:id', usuarioController.actualizarUsuario);

// DELETE /api/usuarios/:id - Inactivar usuario
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;