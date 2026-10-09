const Gateway = require('../models/Gateway');
const { registrarEvento } = require('../utils/auditoria');

// POST: Crear Gateway (Normalmente se crean los 5 al inicio del proyecto)
exports.crearGateway = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Administrador Sistema';
        const nuevoGateway = new Gateway({
            ...req.body,
            usuarioCreacion: nombreUsuario,
            usuarioActualizacion: nombreUsuario
        });
        await nuevoGateway.save();
        res.status(201).json({ mensaje: 'Gateway registrado exitosamente', gateway: nuevoGateway });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ mensaje: 'El número de Gateway ya existe.' });
        }
        res.status(500).json({ mensaje: 'Error al crear el gateway', error: error.message });
    }
};

// GET: Obtener todos los Gateways activos
exports.obtenerGateways = async (req, res) => {
    try {
        const gateways = await Gateway.find({ activo: true }).sort({ numeroGateway: 1 });
        res.status(200).json(gateways);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los gateways', error: error.message });
    }
};

// PUT: Actualizar Gateway (Aplica RN-GW-01 y RN-GW-02)
exports.actualizarGateway = async (req, res) => {
    try {
        const { estado, tipoCargaPermitida } = req.body;
        const nombreUsuario = req.usuario?.nombre || 'Administrador Sistema';

        const gatewayExistente = await Gateway.findById(req.params.id);
        if (!gatewayExistente) {
            return res.status(404).json({ mensaje: 'Gateway no encontrado' });
        }

        // AUDITORÍA RN-14: Registro de mantenimiento
        const usuarioId = req.usuario?.id || req.usuario?._id;
            await registrarEvento(usuarioId, nombreUsuario, 'GATEWAY_MANTENIMIENTO', null, {
                gateway: gatewayExistente.numeroGateway,
                estadoAnterior: gatewayExistente.estado,
                nuevoEstado: estado
            });

        // Validaciones Estrictas (RN-GW-01 y RN-GW-02)
        if (gatewayExistente.estado === 'OCUPADO') {
            if (estado === 'FUERA DE SERVICIO') {
                return res.status(400).json({ mensaje: 'Error (RN-GW-01): No puede poner fuera de servicio un gateway ocupado. Finalice la descarga primero.' });
            }
            if (tipoCargaPermitida && tipoCargaPermitida !== gatewayExistente.tipoCargaPermitida) {
                return res.status(400).json({ mensaje: 'Error (RN-GW-02): No puede cambiar el tipo de carga mientras el gateway está ocupado.' });
            }
        }

        const gatewayActualizado = await Gateway.findByIdAndUpdate(
            req.params.id,
            { ...req.body, usuarioActualizacion: nombreUsuario },
            { new: true }
        );

        res.status(200).json({ mensaje: 'Gateway actualizado correctamente', gateway: gatewayActualizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el gateway', error: error.message });
    }
};

// DELETE: Borrado Lógico de Gateway (Aplica RN-GW-01)
exports.inactivarGateway = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Administrador Sistema';
        
        const gatewayExistente = await Gateway.findById(req.params.id);
        if (!gatewayExistente) {
            return res.status(404).json({ mensaje: 'Gateway no encontrado' });
        }

        // RN-GW-01: Prohibido inactivar (soft delete) si está ocupado
        if (gatewayExistente.estado === 'OCUPADO') {
            return res.status(400).json({ mensaje: 'Error (RN-GW-01): No se puede inactivar un gateway que está OCUPADO.' });
        }

        gatewayExistente.activo = false;
        gatewayExistente.usuarioActualizacion = nombreUsuario;
        await gatewayExistente.save();

        res.status(200).json({ mensaje: 'Gateway inactivado exitosamente (Soft Delete)' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al inactivar el gateway', error: error.message });
    }
};