const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middlewares/auth'); // Tu middleware de JWT (Sprint 0)
const checkPermission = require('../middlewares/checkPermission'); // Nuevo middleware Sprint 7

// Rutas base: /api/roles
// Solo los usuarios que tengan el permiso 'roles' en su perfil podrán ejecutar estas acciones
router.get('/', auth, checkPermission(['roles']), roleController.getRoles);
router.post('/', auth, checkPermission(['roles']), roleController.createRole);
router.put('/:id', auth, checkPermission(['roles']), roleController.updateRole);
router.delete('/:id', auth, checkPermission(['roles']), roleController.deleteRole);

module.exports = router;