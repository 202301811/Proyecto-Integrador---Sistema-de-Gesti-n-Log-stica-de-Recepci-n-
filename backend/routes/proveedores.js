const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const proveedorController = require('../controllers/proveedorController');

// Middleware local para revisar si express-validator encontró errores
const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    next();
};

// GET /api/proveedores - Obtener todos los activos
router.get('/', proveedorController.obtenerProveedores);

// POST /api/proveedores - Crear nuevo
router.post('/',
    [
        body('razonSocial', 'La razón social es obligatoria').notEmpty().trim(),
        body('identificacionTributaria', 'La identificación tributaria es obligatoria').notEmpty().trim(),
        body('emailContacto', 'Debe ser un correo electrónico válido').isEmail().normalizeEmail(),
        body('categoria', 'La categoría debe ser "construcción" o "general"').isIn(['construcción', 'general']),
        validarCampos
    ],
    proveedorController.crearProveedor
);

// PUT /api/proveedores/:id - Actualizar proveedor
router.put('/:id',
    [
        body('emailContacto', 'Debe ser un correo electrónico válido').optional().isEmail().normalizeEmail(),
        body('categoria', 'La categoría debe ser "construcción" o "general"').optional().isIn(['construcción', 'general']),
        validarCampos
    ],
    proveedorController.actualizarProveedor
);

// DELETE /api/proveedores/:id - Borrado lógico (Soft Delete)
router.delete('/:id', proveedorController.inactivarProveedor);

module.exports = router;