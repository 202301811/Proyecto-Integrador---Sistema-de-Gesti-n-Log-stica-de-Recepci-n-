const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const llegadaController = require('../controllers/llegadaController');

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
};

// POST /api/llegadas - Endpoint transaccional principal[cite: 10]
router.post('/',
    [
        body('numeroPedido', 'El número de pedido es obligatorio').notEmpty().trim(),
        validarCampos
    ],
    llegadaController.registrarLlegada
);

module.exports = router;