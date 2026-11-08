const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

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
        const { token } = req.body; 
        
        const usuario = await User.findById(req.usuario.id).select('+twoFactorSecret');

        if (!usuario || !usuario.twoFactorSecret) {
            return res.status(400).json({ mensaje: 'No hay configuración MFA pendiente.' });
        }

        const esValido = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1 
        });

        if (!esValido) {
            return res.status(400).json({ mensaje: 'El código TOTP ingresado es incorrecto o ha expirado.' });
        }

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
        const { token } = req.body; 
        
        const usuario = await User.findById(req.usuario.id).select('+twoFactorSecret').populate('roles');

        if (!usuario || !usuario.twoFactorEnabled) {
            return res.status(400).json({ mensaje: 'MFA no está habilitado para este usuario.' });
        }

        const esValido = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1 
        });

        if (!esValido) {
            return res.status(400).json({ mensaje: 'Código TOTP incorrecto.' });
        }

        // SPRINT 7: Extraer el nombre del rol y la lista unificada de permisos
        let permisosSet = new Set();
        let rolNombre = 'operador';

        if (usuario.roles && usuario.roles.length > 0) {
            // Extraemos la primera palabra en minúsculas (Ej: "Supervisor de Turno" -> "supervisor")
            const rolOriginal = usuario.roles[0].nombreRol || usuario.roles[0].nombre || 'operador';
            rolNombre = rolOriginal.split(' ')[0].toLowerCase();
            
            usuario.roles.forEach(rol => {
                if (rol && rol.activo && rol.permisos) {
                    rol.permisos.forEach(p => permisosSet.add(p));
                }
            });
        }
        const permisos = Array.from(permisosSet);

        // SPRINT 7: Payload unificado (idéntico al de authController)
        const payload = {
            id: usuario._id,
            email: usuario.email,
            nombres: usuario.nombres,
            rol: rolNombre,
            permisos: permisos
        };

        const tokenDefinitivo = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen',
            { expiresIn: '8h' }
        );

        res.status(200).json({
            mensaje: 'Autenticación en dos pasos exitosa',
            token: tokenDefinitivo,
            usuario: payload
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar el código MFA.' });
    }
};