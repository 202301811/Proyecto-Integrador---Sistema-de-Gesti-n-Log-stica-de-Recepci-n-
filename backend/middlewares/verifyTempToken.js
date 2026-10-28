const jwt = require('jsonwebtoken');

exports.verifyTempToken = (req, res, next) => {
    // Extraer token del header Authorization: Bearer <token>
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No hay token temporal.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Solo aceptar tokens de tipo MFA_TEMP
        if (decoded.type !== 'MFA_TEMP') {
            return res.status(403).json({ mensaje: 'Error: El token proporcionado no es válido para esta operación (MFA).' });
        }

        req.usuario = decoded; // Pasamos el ID del usuario al controlador
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token temporal expirado o inválido. Vuelve a iniciar sesión.' });
    }
};