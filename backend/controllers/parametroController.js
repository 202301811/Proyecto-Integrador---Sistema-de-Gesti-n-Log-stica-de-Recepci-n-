const Parametro = require('../models/Parametro');

exports.crearParametro = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        const nuevoParametro = new Parametro({
            ...req.body,
            usuarioCreacion: nombreUsuario,
            usuarioActualizacion: nombreUsuario
        });
        await nuevoParametro.save();
        res.status(201).json({ mensaje: 'Parámetro creado exitosamente', parametro: nuevoParametro });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ mensaje: 'La clave del parámetro ya existe.' });
        res.status(500).json({ mensaje: 'Error al crear parámetro', error: error.message });
    }
};

exports.obtenerParametros = async (req, res) => {
    try {
        // RN-SoftDelete: Solo obtener los activos
        const parametros = await Parametro.find({ activo: true });
        res.status(200).json(parametros);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener parámetros', error: error.message });
    }
};

exports.actualizarParametro = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        const parametroActualizado = await Parametro.findByIdAndUpdate(
            req.params.id,
            { ...req.body, usuarioActualizacion: nombreUsuario },
            { new: true }
        );
        if (!parametroActualizado) return res.status(404).json({ mensaje: 'Parámetro no encontrado' });
        res.status(200).json({ mensaje: 'Parámetro actualizado', parametro: parametroActualizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar parámetro', error: error.message });
    }
};

exports.inactivarParametro = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        const parametroInactivo = await Parametro.findByIdAndUpdate(
            req.params.id,
            { activo: false, usuarioActualizacion: nombreUsuario },
            { new: true }
        );
        if (!parametroInactivo) return res.status(404).json({ mensaje: 'Parámetro no encontrado' });
        res.status(200).json({ mensaje: 'Parámetro inactivado', parametro: parametroInactivo });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al inactivar parámetro', error: error.message });
    }
};