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

// GET /api/pedidos - Obtener todos los activos
router.get('/', pedidoController.obtenerPedidos);

// POST /api/pedidos - Crear nueva cita
router.post('/',
    [
        body('numeroPedido', 'El número de pedido es obligatorio').notEmpty().trim(),
        body('proveedorId', 'Debe ser un ID válido de MongoDB').isMongoId(),
        body('tipoProducto', 'El tipo de producto debe ser "construcción" o "general"').isIn(['construcción', 'general']),
        body('fechaHoraProgramada', 'La fecha y hora programada es obligatoria (formato ISO8601)').isISO8601(),
        body('duracionEstimadaMinutos', 'La duración debe ser un número mayor a cero').isInt({ gt: 0 }),
        validarCampos
    ],
    pedidoController.crearPedido
);

// PUT /api/pedidos/:id - Reprogramar cita
router.put('/:id',
    [
        body('fechaHoraProgramada', 'La fecha y hora programada es obligatoria (formato ISO8601)').optional().isISO8601(),
        validarCampos
    ],
    pedidoController.reprogramarPedido
);

// DELETE /api/pedidos/:id - Cancelar cita (Soft Delete)
router.delete('/:id', pedidoController.cancelarPedido);

module.exports = router;