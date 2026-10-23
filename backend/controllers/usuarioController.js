const User = require('../models/User');
const Role = require('../models/Role'); // Es Necesario para asociar el ObjectId del rol

exports.obtenerUsuarios = async (req, res) => {
    try {
        // Traemos a todos los usuarios activos y poblamos su rol para que el frontend pueda leer el nombre
        const usuarios = await User.find({ estado: 'activo' }).populate('roles');
        res.status(200).json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

exports.crearUsuario = async (req, res) => {
    try {
        // Agregamos nombres y apellidosCompleto al destructuring
        const { nombreCompleto, nombres, apellidosCompleto, email, password, rol, mfaObligatorio } = req.body;

        // Verificar si el correo ya existe
        const existe = await User.findOne({ email: email.toLowerCase().trim() });
        if (existe) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado en el sistema.' });
        }

        // Buscar el ID del rol seleccionado
        const rolEncontrado = await Role.findOne({ nombre: rol });
        const rolId = rolEncontrado ? [rolEncontrado._id] : [];

        const nuevoUsuario = new User({
            nombreCompleto,
            nombres,               // Pasamos el campo que exige Mongoose
            apellidosCompleto,     // Pasamos el campo que exige Mongoose
            email: email.toLowerCase().trim(),
            password, // El pre-save hook de Mongoose lo encriptará automáticamente
            roles: rolId,
            mfaObligatorio: mfaObligatorio || false
        });

        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear usuario' });
    }
};

exports.actualizarUsuario = async (req, res) => {
    try {
        // Agregamos nombres y apellidosCompleto al destructuring
        const { nombreCompleto, nombres, apellidosCompleto, email, password, rol, mfaObligatorio } = req.body;
        const usuario = await User.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Actualizamos los campos básicos
        if (nombreCompleto) usuario.nombreCompleto = nombreCompleto;
        if (nombres) usuario.nombres = nombres;
        if (apellidosCompleto) usuario.apellidosCompleto = apellidosCompleto;
        if (email) usuario.email = email.toLowerCase().trim();
        
        // REGLA SPRINT 5: Actualizar Gobernanza MFA
        if (mfaObligatorio !== undefined) {
            usuario.mfaObligatorio = mfaObligatorio;
        }

        // Si el admin escribió una nueva contraseña, la actualizamos
        if (password && password.trim() !== '') {
            usuario.password = password;
        }

        // Si cambió el rol, actualizamos la referencia
        if (rol) {
            const rolEncontrado = await Role.findOne({ nombre: rol });
            if (rolEncontrado) {
                usuario.roles = [rolEncontrado._id];
            }
        }

        // Guardamos (esto vuelve a pasar por el encriptador si la contraseña cambió)
        await usuario.save();
        res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        
        // Soft delete: En lugar de borrarlo de la BD, lo inactivamos para conservar el historial
        usuario.estado = 'inactivo';
        await usuario.save();

        res.status(200).json({ mensaje: 'Usuario inactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al inactivar usuario' });
    }
};