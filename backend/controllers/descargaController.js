const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const Evento = require('../models/Evento'); 
const { MaxHeap } = require('../utils/ColaPrioridad'); 
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
        const usuarioId = req.usuario?.id || req.usuario?._id; 
        const nombreUsuario = req.usuario?.nombre || 'Operador de Descarga';

        // Modelos externos requeridos (asegúrate de que estén importados arriba en tu archivo)
        const Pedido = require('../models/Pedido');
        const Gateway = require('../models/Gateway');
        const { MaxHeap } = require('../utils/ColaPrioridad');
        const { registrarEvento } = require('../utils/auditoria');

        let descarga;
        if (descargaId) descarga = await Descarga.findById(descargaId);
        else if (gatewayId) descarga = await Descarga.findOne({ gatewayId, fechaHoraFin: null });

        if (!descarga) return res.status(404).json({ mensaje: 'No hay una descarga activa en este Gateway.' });
        if (descarga.fechaHoraFin) return res.status(400).json({ mensaje: 'Esta descarga ya fue finalizada.' });

        // 1. Finalizar la descarga actual
        const fechaFin = new Date();
        descarga.fechaHoraFin = fechaFin;
        descarga.duracionMinutos = Math.round((fechaFin.getTime() - descarga.fechaHoraInicio.getTime()) / 60000);
        descarga.usuarioActualizacion = nombreUsuario;
        await descarga.save();

        // 2. Actualizar el pedido anterior a FINALIZADO
        await Pedido.findByIdAndUpdate(descarga.pedidoId, { 
            estado: 'FINALIZADO', 
            usuarioActualizacion: nombreUsuario 
        });

        // ---------------------------------------------------------------------------
        // 3. SPRINT 6 - RN-11: PROMOCIÓN AUTOMÁTICA CON MAX-HEAP
        // ---------------------------------------------------------------------------
        const gatewayActual = await Gateway.findById(descarga.gatewayId || gatewayId);
        const tipoCargaGateway = gatewayActual.tipoCargaPermitida.toUpperCase();

        // Extraer de la base de datos SOLO los pedidos compatibles con la exclusividad del Gateway
        const pedidosCompatibles = await Pedido.find({ 
            estado: 'EN COLA', 
            tipoProducto: tipoCargaGateway,
            activo: true
        });

        if (pedidosCompatibles.length > 0) {
            // Instanciar motor algorítmico
            const heap = new MaxHeap();
            pedidosCompatibles.forEach(pedido => heap.insert(pedido));
            
            // Extraer la raíz del heap (O(1) para el máximo de prioridad)
            const colaOrdenada = heap.sort();
            const pedidoPromovido = colaOrdenada[0];

            // Promover vehículo
            pedidoPromovido.estado = 'DESCARGANDO';
            pedidoPromovido.usuarioActualizacion = nombreUsuario;
            await pedidoPromovido.save();

            // Crear la nueva transacción para el camión inyectado automáticamente
            const nuevaDescarga = new Descarga({
                gatewayId: gatewayActual._id,
                pedidoId: pedidoPromovido._id,
                operadorId: usuarioId,
                fechaHoraInicio: new Date(),
                usuarioCreacion: nombreUsuario,
                usuarioActualizacion: nombreUsuario
            });
            await nuevaDescarga.save();

            // Auditoría inmutable (RN-14)
            await registrarEvento(usuarioId, nombreUsuario, 'PROMOCION_AUTOMATICA_GATEWAY', pedidoPromovido._id, {
                numeroPedido: pedidoPromovido.numeroPedido,
                gatewayAsignado: gatewayActual.numeroGateway,
                prioridad: pedidoPromovido.prioridadCalculada,
                tiempoEnCola: pedidoPromovido.minutosEnEspera
            });

            // Respuesta cuando inyecta un camión nuevo
            return res.status(200).json({ 
                mensaje: 'Descarga finalizada. El algoritmo inyectó automáticamente el camión (RN-11).', 
                descarga: descarga, 
                duracionMinutos: descarga.duracionMinutos, 
                nuevoAsignado: pedidoPromovido
            });

        } else {
            // Si la cola está vacía para ese tipo de carga, el Gateway queda libre
            gatewayActual.estado = 'LIBRE';
            gatewayActual.usuarioActualizacion = nombreUsuario;
            await gatewayActual.save();

            // Respuesta cuando se queda vacío
            return res.status(200).json({ 
                mensaje: 'Descarga finalizada. Gateway libre (no hay camiones compatibles en espera).', 
                descarga: descarga,
                duracionMinutos: descarga.duracionMinutos
            });
        }
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al finalizar descarga', error: error.message });
    }
};