const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const auth = require('../middlewares/auth'); // Importamos el validador del token JWT
const checkPermission = require('../middlewares/checkPermission'); // Importamos el validador de RBAC 

// GET /api/usuarios - Obtener todos los usuarios activos
// Protegido: Solo usuarios autenticados que tengan el permiso 'usuarios' en su rol
router.get('/', auth, checkPermission(['usuarios']), usuarioController.obtenerUsuarios);

// POST /api/usuarios - Crear nuevo usuario
router.post('/', auth, checkPermission(['usuarios']), usuarioController.crearUsuario);

// PUT /api/usuarios/:id - Actualizar usuario existente (incluyendo el switch MFA)
router.put('/:id', auth, checkPermission(['usuarios']), usuarioController.actualizarUsuario);

// DELETE /api/usuarios/:id - Inactivar usuario mediante baja lógica
router.delete('/:id', auth, checkPermission(['usuarios']), usuarioController.eliminarUsuario);

module.exports = router;