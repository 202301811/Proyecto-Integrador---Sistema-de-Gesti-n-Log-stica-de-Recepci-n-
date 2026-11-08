const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Extraer el token del header Authorization (Bearer <token>)
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'Acceso denegado. No hay token de autenticación.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'Formato de token no válido.' });
    }

    try {
        // 2. Verificar el token usando tu secreto
        // (Nota: Usamos el mismo fallback de seguridad que pusiste en tu authController)
        const cifrado = jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen');
        
        // 3. Inyectar los datos del usuario en la request para que los controladores y checkPermission los puedan leer
        req.usuario = cifrado; 
        
        // 4. Pasar al siguiente middleware (checkPermission) o al controlador
        next();
    } catch (error) {
        return res.status(401).json({ msg: 'Token no válido o expirado. Por favor, inicia sesión nuevamente.' });
    }
};