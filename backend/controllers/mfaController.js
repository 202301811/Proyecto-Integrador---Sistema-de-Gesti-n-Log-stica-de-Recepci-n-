const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ajusta la ruta a tu modelo

// POST /api/mfa/setup (Protegido por verifyTempToken)
exports.setupMfa = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // 1. Generar secreto Base32
        const secret = speakeasy.generateSecret({ 
            name: `Logística FEEN (${usuario.email})` 
        });

        // 2. Guardar temporalmente el secreto en la base de datos (oculto)
        usuario.twoFactorSecret = secret.base32;
        await usuario.save();

        // 3. Devolver la URL del QR (otpauth://)
        res.status(200).json({
            mensaje: 'Secreto MFA generado',
            secret: secret.base32,
            qrUri: secret.otpauth_url
        });
    } catch (error) {
        console.error("Error en setupMfa:", error);
        res.status(500).json({ mensaje: 'Error al generar la configuración MFA.' });
    }
};

// POST /api/mfa/enable (Protegido por verifyTempToken)
exports.enableMfa = async (req, res) => {
    try {
        const { token } = req.body; // El código de 6 dígitos que el usuario tipea
        
        // Pedir el secret a la BD
        const usuario = await User.findById(req.usuario.id).select('+twoFactorSecret');

        if (!usuario || !usuario.twoFactorSecret) {
            return res.status(400).json({ mensaje: 'No hay configuración MFA pendiente.' });
        }

        // Validación estricta con ventana de tolerancia de ±1 (30s)
        const esValido = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1 // RN: clock drift
        });

        if (!esValido) {
            return res.status(400).json({ mensaje: 'El código TOTP ingresado es incorrecto o ha expirado.' });
        }

        // Activar MFA en el perfil
        usuario.twoFactorEnabled = true;
        await usuario.save();

        res.status(200).json({ mensaje: 'Autenticación Multifactor activada exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al habilitar MFA.' });
    }
};

// POST /api/auth/mfa/verify-login (Protegido por verifyTempToken)
exports.verifyLoginMfa = async (req, res) => {
    try {
        const { token } = req.body; // El código de 6 dígitos
        
        const usuario = await User.findById(req.usuario.id).select('+twoFactorSecret').populate('roles');

        if (!usuario || !usuario.twoFactorEnabled) {
            return res.status(400).json({ mensaje: 'MFA no está habilitado para este usuario.' });
        }

        // Verificar el TOTP
        const esValido = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1 // RN: Tolerancia de desfasaje de tiempo
        });

        if (!esValido) {
            return res.status(400).json({ mensaje: 'Código TOTP incorrecto.' });
        }

        // Si el código es correcto, emitir el JWT Definitivo de 8 horas
        const tokenDefinitivo = jwt.sign(
            { id: usuario._id, rol: usuario.roles[0].nombre, nombre: usuario.nombreCompleto },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            mensaje: 'Autenticación en dos pasos exitosa',
            token: tokenDefinitivo,
            rol: usuario.roles[0].nombre,
            usuario: { id: usuario._id, nombre: usuario.nombreCompleto }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar el código MFA.' });
    }
};