const express = require('express');
const router = express.Router();
const colaController = require('../controllers/colaController');

// GET /api/cola - Devuelve la cola ordenada
router.get('/', colaController.obtenerCola);

// POST /api/cola/reevaluar - Fuerza el recálculo (Aging)
router.post('/reevaluar', colaController.reevaluarCola);

module.exports = router;