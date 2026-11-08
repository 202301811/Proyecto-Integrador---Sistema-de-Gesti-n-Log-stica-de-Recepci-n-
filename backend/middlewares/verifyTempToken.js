const jwt = require('jsonwebtoken');

const verifyTempToken = (req, res, next) => {
    // 1. Extraer el token del Header de Authorization (Formato: "Bearer <token>")
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ mensaje: 'No hay token temporal. Acceso denegado.' });
    }

    const token = authHeader.split(' ')[1]; // Separamos "Bearer" del token real

    if (!token) {
        return res.status(401).json({ mensaje: 'Formato de token temporal inválido.' });
    }

    try {
        // 2. Verificar y decodificar el token temporal
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen');
        
        // Opcional: Validar que sea un token tipo MFA_TEMP
        if (decoded.type !== 'MFA_TEMP') {
            return res.status(403).json({ mensaje: 'El token proporcionado no es válido para esta operación.' });
        }

        // 3. Inyectar los datos del usuario en la request (req.usuario)
        req.usuario = decoded;
        next(); // Pasar el control al mfaController
    } catch (error) {
        console.error('Error al verificar TempToken:', error.message);
        return res.status(401).json({ mensaje: 'Token temporal expirado o inválido. Vuelve a iniciar sesión.' });
    }
};

module.exports = { verifyTempToken };