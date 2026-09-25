const Proveedor = require('../models/Proveedor');

// POST: Crear Proveedor
exports.crearProveedor = async (req, res) => {
    try {
        // Extraemos el nombre del token (inyectado por el middleware autenticar)
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';

        const nuevoProveedor = new Proveedor({
            ...req.body,
            usuarioCreacion: nombreUsuario,
            usuarioActualizacion: nombreUsuario
        });

        await nuevoProveedor.save();
        res.status(201).json({ mensaje: 'Proveedor registrado', proveedor: nuevoProveedor });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ mensaje: 'La identificación tributaria ya está registrada.' });
        }
        res.status(500).json({ mensaje: 'Error al registrar proveedor', error: error.message });
    }
};

// GET: Consultar Proveedores (Solo los activos)
exports.obtenerProveedores = async (req, res) => {
    try {
        // RN-SoftDelete: Filtrar por defecto únicamente los registros activos
        const proveedores = await Proveedor.find({ activo: true });
        res.status(200).json(proveedores);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener proveedores', error: error.message });
    }
};

// PUT: Actualizar Proveedor
exports.actualizarProveedor = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        
        const proveedorActualizado = await Proveedor.findByIdAndUpdate(
            req.params.id,
            { ...req.body, usuarioActualizacion: nombreUsuario },
            { new: true }
        );
        
        if (!proveedorActualizado) {
            return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
        }
        res.status(200).json({ mensaje: 'Proveedor actualizado exitosamente', proveedor: proveedorActualizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar proveedor', error: error.message });
    }
};

// DELETE: Inactivar Proveedor (Soft Delete)
exports.inactivarProveedor = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        
        // RN-SoftDelete: Prohibido usar remove(). Solo actualizamos activo a false.
        const proveedorInactivo = await Proveedor.findByIdAndUpdate(
            req.params.id,
            { activo: false, usuarioActualizacion: nombreUsuario },
            { new: true }
        );

        if (!proveedorInactivo) {
            return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
        }
        res.status(200).json({ mensaje: 'Proveedor inactivado exitosamente', proveedor: proveedorInactivo });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al inactivar proveedor', error: error.message });
    }
};