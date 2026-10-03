const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const descargaController = require('../controllers/descargaController');

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
};

// POST /api/descargas/iniciar
router.post('/iniciar',
    [
        body('pedidoId', 'El ID del pedido es obligatorio').isMongoId(),
        body('gatewayId', 'El ID del gateway es obligatorio').isMongoId(),
        validarCampos
    ],
    descargaController.iniciarDescarga
);

// POST /api/descargas/finalizar
router.post('/finalizar',
    [
        body('descargaId', 'ID de descarga inválido').optional().isMongoId(),
        body('gatewayId', 'ID de gateway inválido').optional().isMongoId(),
        validarCampos
    ],
    descargaController.finalizarDescarga
);

module.exports = router;