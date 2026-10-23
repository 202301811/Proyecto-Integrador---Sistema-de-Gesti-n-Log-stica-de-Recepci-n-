const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const mfaController = require('../controllers/mfaController');
const { verifyTempToken } = require('../middlewares/verifyTempToken');

// POST /api/auth/login - Autenticación de credenciales (Paso 1)
router.post('/login', authController.login);

// POST /api/auth/mfa/verify-login - Validación TOTP y JWT definitivo (Paso 2)
router.post('/mfa/verify-login', verifyTempToken, mfaController.verifyLoginMfa);

module.exports = router;