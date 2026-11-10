const express = require('express');
const router = express.Router();
const colaController = require('../controllers/colaController');
const auth = require('../middlewares/auth'); 
const checkPermission = require('../middlewares/checkPermission');

// GET /api/cola - Devuelve la cola ordenada
//router.get('/', auth, checkPermission(['cola']), colaController.obtenerCola);
router.get('/', colaController.obtenerCola);

// POST /api/cola/reevaluar - Fuerza el recálculo (Aging)
router.post('/reevaluar', auth, checkPermission(['cola']), colaController.reevaluarCola);

module.exports = router;