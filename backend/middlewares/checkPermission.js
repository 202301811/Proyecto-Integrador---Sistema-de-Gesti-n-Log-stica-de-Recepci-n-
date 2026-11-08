const User = require('../models/User'); // Corregido: Apuntando al modelo en inglés (User.js)

const checkPermission = (permisosRequeridos) => {
    return async (req, res, next) => {
        try {
            // El req.usuario viene del middleware auth.js
            const usuarioId = req.usuario.id;
            
            // Buscamos al usuario y poblamos sus roles
            const usuario = await User.findById(usuarioId).populate('roles');
            
            if (!usuario) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
            }

            // Si el usuario no está activo, bloquear
            if (!usuario.activo) {
                return res.status(403).json({ mensaje: 'Usuario inactivo.' });
            }

            // Recolectar todos los permisos de los roles activos del usuario
            let permisosDelUsuario = new Set();
            if (usuario.roles && usuario.roles.length > 0) {
                usuario.roles.forEach(rol => {
                    if (rol && rol.activo && rol.permisos) {
                        rol.permisos.forEach(p => permisosDelUsuario.add(p));
                    }
                });
            }
            
            const arrayPermisos = Array.from(permisosDelUsuario);

            // Validar si el usuario tiene al menos uno de los permisos requeridos por la ruta
            const tieneAcceso = permisosRequeridos.some(permiso => arrayPermisos.includes(permiso));

            if (!tieneAcceso) {
                return res.status(403).json({ 
                    mensaje: 'Acceso denegado: No tienes los permisos necesarios para este módulo.' 
                });
            }

            // Si todo está bien, pasa al controlador
            next();
        } catch (error) {
            console.error('Error en checkPermission:', error);
            res.status(500).json({ mensaje: 'Error interno al validar los permisos.' });
        }
    };
};

module.exports = checkPermission;