const express = require('express');
const router = express.Router();
const mfaController = require('../controllers/mfaController');
const { verifyTempToken } = require('../middlewares/verifyTempToken');

// POST /api/mfa/setup - Genera secreto Base32 y URI para el QR
router.post('/setup', verifyTempToken, mfaController.setupMfa);

// POST /api/mfa/enable - Valida el primer código y activa el MFA en el perfil
router.post('/enable', verifyTempToken, mfaController.enableMfa);

module.exports = router;