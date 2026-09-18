const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator'); // Importación de express-validator
const proveedorController = require('../controllers/proveedorController');

// Middleware local para revisar si express-validator encontró errores
const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() }); // Responde HTTP 400 si hay error[cite: 2]
    }
    next();
};

// POST /api/proveedores
router.post('/',
    [
        body('razonSocial', 'La razón social es obligatoria').notEmpty().trim(),
        body('identificacionTributaria', 'La identificación tributaria es obligatoria').notEmpty().trim(),
        body('emailContacto', 'Debe ser un correo electrónico válido').isEmail().normalizeEmail(), // Validación de correo[cite: 3]
        body('categoria', 'La categoría debe ser "construcción" o "general"').isIn(['construcción', 'general']), // Lista cerrada[cite: 3]
        validarCampos
    ],
    proveedorController.crearProveedor
);

module.exports = router;