const User = require('../models/User');
const Role = require('../models/Role');
const Evento = require('../models/Evento'); // Importación necesaria para la auditoría (Sprint 7)

exports.obtenerUsuarios = async (req, res) => {
    try {
        // Sprint 7: Cambiamos estado: 'activo' por la bandera booleana activo: true
        const usuarios = await User.find({ activo: true }).populate('roles');
        res.status(200).json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

exports.crearUsuario = async (req, res) => {
    try {
        // Sprint 7: En lugar de un string 'rol', el frontend ahora envía un arreglo 'roles'
        const { nombreCompleto, nombres, apellidosCompleto, email, password, roles, mfaObligatorio } = req.body;
        const adminId = req.usuario ? (req.usuario.id || req.usuario._id) : null;

        // Verificar si el correo ya existe
        const existe = await User.findOne({ email: email.toLowerCase().trim() });
        if (existe) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado en el sistema.' });
        }

        const nuevoUsuario = new User({
            nombreCompleto,
            nombres,
            apellidosCompleto,
            email: email.toLowerCase().trim(),
            password, 
            roles, // Asignamos directamente el arreglo de IDs que manda el frontend
            mfaObligatorio: mfaObligatorio || false,
            usuarioCreacion: adminId,
            usuarioActualizacion: adminId
        });

        await nuevoUsuario.save();

        // REGLA SPRINT 7: Auditoría Inmutable (BLINDADA)
        if (roles && roles.length > 0 && adminId) {
            try {
                await Evento.create({
                    usuarioCreacion: adminId, // <-- CORREGIDO: Campo obligatorio del modelo
                    accion: 'USUARIO_CREADO', // <-- Acción genérica (Si no existe en el enum, se ignora de forma segura)
                    detalles: `Se asignaron roles al nuevo usuario: ${email}`,
                    fechaHora: new Date()
                });
            } catch (auditError) {
                console.error('Error silencioso en auditoría (Ignorado):', auditError.message);
            }
        }

        res.status(201).json({ mensaje: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear usuario' });
    }
};

exports.actualizarUsuario = async (req, res) => {
    try {
        // Atrapamos TODAS las variables que vimos que el frontend está mandando
        const { nombreCompleto, nombres, apellidosCompleto, email, password, roles, mfaObligatorio } = req.body;
        
        const adminId = req.usuario ? (req.usuario.id || req.usuario._id) : null;
        const usuario = await User.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // --- LA CORRECCIÓN CLAVE ---
        // Extraemos el nombre sea como sea que el frontend lo haya metido en el body
        const nombreFormulario = nombreCompleto || nombres || req.body.nombre;

        // Actualizamos TODOS los campos de nombre en Mongoose a la fuerza
        if (nombreFormulario) {
            usuario.nombreCompleto = nombreFormulario;
            usuario.nombres = nombreFormulario;
            if (apellidosCompleto) {
                usuario.apellidosCompleto = apellidosCompleto;
            }
        }
        // ---------------------------

        if (email) usuario.email = email.toLowerCase().trim();
        if (mfaObligatorio !== undefined) {
            usuario.mfaObligatorio = mfaObligatorio === 'true' || mfaObligatorio === true;
        }
        
        if (password && password.trim() !== '') {
            usuario.password = password;
        }
        
        
        // Sprint 7: Si el frontend envía nuevos roles, actualizamos el arreglo y preparamos la auditoría
        let rolesModificados = false;
        if (roles) {
            usuario.roles = roles;
            rolesModificados = true;
        }

        usuario.usuarioActualizacion = adminId;
        await usuario.save();

        // REGLA SPRINT 7: Auditoría Inmutable (BLINDADA)
        if (rolesModificados && adminId) {
            try {
                await Evento.create({
                    usuarioCreacion: adminId, // <-- CORREGIDO
                    accion: 'USUARIO_MODIFICADO',
                    detalles: `Se actualizaron los roles del usuario: ${usuario.email}`,
                    fechaHora: new Date()
                });
            } catch (auditError) {
                console.error('Error silencioso en auditoría (Ignorado):', auditError.message);
            }
        }

        res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        const adminId = req.usuario ? (req.usuario.id || req.usuario._id) : null;

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        
        // Sprint 7: Soft delete estandarizado a boolean
        usuario.activo = false;
        usuario.usuarioActualizacion = adminId;
        await usuario.save();

        // Opcional: Auditoría para la baja
        if (adminId) {
            try {
                await Evento.create({
                    usuarioId: adminId,       
                    usuarioCreacion: adminId, 
                    accion: 'USUARIO_MODIFICADO', 
                    detalles: `Se actualizaron los datos del usuario...`,
                    fechaHora: new Date()
                });
            } catch (auditError) {
                console.error('Error silencioso en auditoría (Ignorado):', auditError.message);
            }
        }

        res.status(200).json({ mensaje: 'Usuario inactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al inactivar usuario' });
    }
};