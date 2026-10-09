const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const { registrarEvento } = require('../utils/auditoria');

// POST: Iniciar Descarga (Aplica RN-07 y RN-08)
exports.iniciarDescarga = async (req, res) => {
    try {
        const { pedidoId, gatewayId } = req.body;
        const usuarioId = req.usuario?.id; // Requerimos el ID del token
        const nombreUsuario = req.usuario?.nombre || 'Operador de Descarga';
        
        const pedido = await Pedido.findById(pedidoId);
        const gateway = await Gateway.findById(gatewayId);

        if (!pedido || !pedido.activo) return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
        if (!gateway || !gateway.activo) return res.status(404).json({ mensaje: 'Gateway no encontrado.' });
        
        if (gateway.estado !== 'LIBRE') {
            return res.status(400).json({ mensaje: `El Gateway ${gateway.numeroGateway} no está disponible.` });
        }
        
        if (pedido.tipoProducto !== gateway.tipoCargaPermitida) {
            return res.status(400).json({ mensaje: `Error (RN-07/08): Incompatibilidad de carga.` });
        }

        const fechaInicio = new Date();
        const nuevaDescarga = new Descarga({
            gatewayId,
            pedidoId,
            operadorId: usuarioId,
            fechaHoraInicio: fechaInicio,
            usuarioCreacion: nombreUsuario,
            usuarioActualizacion: nombreUsuario
        });

        gateway.estado = 'OCUPADO';
        gateway.usuarioActualizacion = nombreUsuario;
        pedido.estado = 'DESCARGANDO';
        pedido.usuarioActualizacion = nombreUsuario;

        await nuevaDescarga.save();
        await gateway.save();
        await pedido.save();

        // AUDITORÍA RN-14: Registro de inicio
            await registrarEvento(usuarioId, nombreUsuario, 'GATEWAY_ASIGNADO', pedidoId, { 
                gatewayAsignado: gateway.numeroGateway 
            });
            await registrarEvento(usuarioId, nombreUsuario, 'DESCARGADA_INICIADA', pedidoId, { 
                tipoCarga: pedido.tipoProducto 
            });

        res.status(201).json({ mensaje: 'Descarga iniciada con éxito', descarga: nuevaDescarga });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar la descarga', error: error.message });
    }
};

// POST: Finalizar Descarga (Aplica RN-11 y Atomicidad)
exports.finalizarDescarga = async (req, res) => {
    try {
        const { descargaId, gatewayId } = req.body;
        const usuarioId = req.usuario?.id; 
        const nombreUsuario = req.usuario?.nombre || 'Operador de Descarga';

        let descarga;
        if (descargaId) descarga = await Descarga.findById(descargaId);
        else if (gatewayId) descarga = await Descarga.findOne({ gatewayId, fechaHoraFin: null });

        if (!descarga) return res.status(404).json({ mensaje: 'No hay una descarga activa en este Gateway.' });
        if (descarga.fechaHoraFin) return res.status(400).json({ mensaje: 'Esta descarga ya fue finalizada.' });

        // 1. Captura Temporal y Cálculo de Duración
        const fechaFin = new Date();
        const duracionMs = fechaFin.getTime() - descarga.fechaHoraInicio.getTime();
        const duracionMinutos = Math.round(duracionMs / 60000);

        descarga.fechaHoraFin = fechaFin;
        descarga.duracionMinutos = duracionMinutos;
        descarga.usuarioActualizacion = nombreUsuario;

        // 2. Transición de Estados (Atomicidad: Guardamos en orden estricto)
        await descarga.save(); // Primero registramos el fin en la descarga

        const pedido = await Pedido.findById(descarga.pedidoId);
        if (pedido) {
            pedido.estado = 'FINALIZADO';
            pedido.usuarioActualizacion = nombreUsuario;
            await pedido.save(); // Segundo el pedido
        }

        const gateway = await Gateway.findById(descarga.gatewayId);
        if (gateway) {
            gateway.estado = 'LIBRE';
            gateway.usuarioActualizacion = nombreUsuario;
            await gateway.save(); // Tercero liberamos la bahía
        }

        // 3. AUDITORÍA RN-14: Registro de fin
            await registrarEvento(usuarioId, nombreUsuario, 'DESCARGA_FINALIZADA', pedido._id, {
                gatewayLiberado: gateway?.numeroGateway,
                duracionMinutos: duracionMinutos
            });

        // 4. Reevaluación de Cola (Verificar si hay vehículos esperando compatibles)
        const siguienteEnCola = await Pedido.findOne({ 
            estado: 'EN COLA', 
            tipoProducto: gateway?.tipoCargaPermitida,
            activo: true
        }).sort({ fechaHoraLlegadaReal: 1 }); // El que llegó primero

        let mensajeCola = 'No hay vehículos en cola.';
        if (siguienteEnCola) {
            mensajeCola = `El vehículo ${siguienteEnCola.numeroPedido} está en cola y es compatible con el Gateway ${gateway?.numeroGateway}.`;
        }

        res.status(200).json({ 
            mensaje: 'Descarga finalizada y Gateway liberado', 
            duracionMinutos,
            mensajeCola,
            descarga 
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al finalizar la descarga', error: error.message });
    }
};