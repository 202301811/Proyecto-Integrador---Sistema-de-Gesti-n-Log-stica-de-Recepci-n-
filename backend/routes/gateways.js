const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const gatewayController = require('../controllers/gatewayController');

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
};

router.get('/', gatewayController.obtenerGateways);

router.post('/',
    [
        body('numeroGateway', 'El número de gateway debe ser entre 1 y 5').isInt({ min: 1, max: 5 }),
        body('tipoCargaPermitida', 'El tipo de carga debe ser general o construcción').isIn(['general', 'construcción']),
        validarCampos
    ],
    gatewayController.crearGateway
);

router.put('/:id',
    [
        body('estado', 'Estado inválido').optional().isIn(['LIBRE', 'OCUPADO', 'FUERA DE SERVICIO']),
        body('tipoCargaPermitida', 'Tipo de carga inválido').optional().isIn(['general', 'construcción']),
        validarCampos
    ],
    gatewayController.actualizarGateway
);

router.delete('/:id', gatewayController.inactivarGateway);

module.exports = router;