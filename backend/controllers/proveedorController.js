const Proveedor = require('../models/Proveedor');

exports.crearProveedor = async (req, res) => {
    try {
        const nuevoProveedor = new Proveedor(req.body);
        await nuevoProveedor.save();
        res.status(201).json({ mensaje: 'Proveedor registrado', proveedor: nuevoProveedor });
    } catch (error) {
        // Capturar error 11000 de MongoDB (llave duplicada) para la identificación tributaria[cite: 3]
        if (error.code === 11000) {
            return res.status(400).json({ mensaje: 'La identificación tributaria ya está registrada.' });
        }
        res.status(500).json({ mensaje: 'Error al registrar proveedor', error: error.message });
    }
};