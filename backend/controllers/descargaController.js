const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');

// POST: Iniciar Descarga (Aplica RN-07 y RN-08)
exports.iniciarDescarga = async (req, res) => {
    try {
        const { pedidoId, gatewayId } = req.body;
        const nombreUsuario = req.usuario?.nombre || 'Operador de Descarga';
        
        // 1. Buscar entidades
        const pedido = await Pedido.findById(pedidoId);
        const gateway = await Gateway.findById(gatewayId);

        if (!pedido || !pedido.activo) return res.status(404).json({ mensaje: 'Pedido no encontrado o inactivo.' });
        if (!gateway || !gateway.activo) return res.status(404).json({ mensaje: 'Gateway no encontrado o inactivo.' });

        // 2. Validar que el Gateway esté LIBRE
        if (gateway.estado !== 'LIBRE') {
            return res.status(400).json({ mensaje: `El Gateway ${gateway.numeroGateway} no está disponible. Estado actual: ${gateway.estado}` });
        }

        // 3. Reglas de Exclusividad (RN-07 y RN-08)
        if (pedido.tipoProducto !== gateway.tipoCargaPermitida) {
            return res.status(400).json({ 
                mensaje: `Error de Incompatibilidad (RN-07/08): Intentó asignar un pedido de tipo '${pedido.tipoProducto.toUpperCase()}' al Gateway ${gateway.numeroGateway} que es exclusivo para '${gateway.tipoCargaPermitida.toUpperCase()}'.`
            });
        }

        // 4. Iniciar la transacción
        const fechaInicio = new Date();
        
        const nuevaDescarga = new Descarga({
            gatewayId,
            pedidoId,
            fechaHoraInicio: fechaInicio,
            usuarioCreacion: nombreUsuario,
            usuarioActualizacion: nombreUsuario
        });

        // 5. Actualizar estados
        gateway.estado = 'OCUPADO';
        gateway.usuarioActualizacion = nombreUsuario;
        
        pedido.estado = 'DESCARGANDO';
        pedido.usuarioActualizacion = nombreUsuario;

        // Guardar todo en la base de datos
        await nuevaDescarga.save();
        await gateway.save();
        await pedido.save();

        res.status(201).json({ mensaje: 'Descarga iniciada con éxito', descarga: nuevaDescarga });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar la descarga', error: error.message });
    }
};

// POST: Finalizar Descarga
exports.finalizarDescarga = async (req, res) => {
    try {
        const { descargaId, gatewayId } = req.body; // Agregamos gatewayId
        const nombreUsuario = req.usuario?.nombre || 'Operador de Descarga';

        // Truco para el Frontend: Si nos mandan el gatewayId, buscamos automáticamente la descarga activa
        let descarga;
        if (descargaId) {
            descarga = await Descarga.findById(descargaId);
        } else if (gatewayId) {
            descarga = await Descarga.findOne({ gatewayId, fechaHoraFin: null });
        }

        if (!descarga) return res.status(404).json({ mensaje: 'No hay una descarga activa en este Gateway.' });
        if (descarga.fechaHoraFin) return res.status(400).json({ mensaje: 'Esta descarga ya fue finalizada previamente.' });

        // 1. Calcular tiempos
        const fechaFin = new Date();
        const duracionMs = fechaFin.getTime() - descarga.fechaHoraInicio.getTime();
        const duracionMinutos = Math.round(duracionMs / 60000);

        descarga.fechaHoraFin = fechaFin;
        descarga.duracionMinutos = duracionMinutos;
        descarga.usuarioActualizacion = nombreUsuario;

        // 2. Liberar Gateway
        const gateway = await Gateway.findById(descarga.gatewayId);
        if (gateway) {
            gateway.estado = 'LIBRE';
            gateway.usuarioActualizacion = nombreUsuario;
            await gateway.save();
        }

        // 3. Finalizar Pedido
        const pedido = await Pedido.findById(descarga.pedidoId);
        if (pedido) {
            pedido.estado = 'FINALIZADO';
            pedido.usuarioActualizacion = nombreUsuario;
            await pedido.save();
        }

        // Guardar transacción
        await descarga.save();

        res.status(200).json({ 
            mensaje: 'Descarga finalizada y Gateway liberado', 
            duracionMinutos, 
            descarga 
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al finalizar la descarga', error: error.message });
    }
};