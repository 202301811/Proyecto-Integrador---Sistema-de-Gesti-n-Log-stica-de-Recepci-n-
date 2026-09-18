const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pedidoController = require('../controllers/pedidoController');

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    next();
};

// POST /api/pedidos[cite: 3]
router.post('/',
    [
        body('numeroPedido', 'El número de pedido es obligatorio').notEmpty().trim(), // Campo obligatorio[cite: 3]
        body('proveedorId', 'Debe ser un ID válido de MongoDB').isMongoId(),
        body('tipoProducto', 'El tipo de producto debe ser "construcción" o "general"').isIn(['construcción', 'general']), // Lista cerrada[cite: 3]
        body('fechaHoraProgramada', 'La fecha y hora programada es obligatoria (formato ISO8601)').isISO8601(),
        body('duracionEstimadaMinutos', 'La duración debe ser un número mayor a cero').isInt({ gt: 0 }), // Mayor a cero[cite: 3]
        validarCampos
    ],
    pedidoController.crearPedido
);

// GET /api/pedidos[cite: 3]
router.get('/', pedidoController.obtenerPedidos);

module.exports = router;