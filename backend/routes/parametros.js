const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const parametroController = require('../controllers/parametroController');

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
};

router.get('/', parametroController.obtenerParametros);

router.post('/',
    [
        body('clave', 'La clave es obligatoria').notEmpty().trim(),
        body('valor', 'El valor es obligatorio').notEmpty().trim(),
        validarCampos
    ],
    parametroController.crearParametro
);

router.put('/:id', parametroController.actualizarParametro);
router.delete('/:id', parametroController.inactivarParametro);

module.exports = router;