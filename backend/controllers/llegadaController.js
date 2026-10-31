const Pedido = require('../models/Pedido');
const Parametro = require('../models/Parametro');
const Gateway = require('../models/Gateway'); 
const { registrarEvento } = require('../utils/auditoria');

exports.registrarLlegada = async (req, res) => {
    try {
        const { numeroPedido } = req.body;
        const usuarioId = req.usuario?.id || req.usuario?._id;
        const nombreUsuario = req.usuario?.nombre || 'Operador Caseta';

        // 1. Buscar el pedido programado
        const pedido = await Pedido.findOne({ numeroPedido, activo: true });
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado o inactivo.' });
        }
        if (pedido.estado !== 'PROGRAMADO') {
            return res.status(400).json({ mensaje: `El pedido ya fue procesado. Estado actual: ${pedido.estado}` });
        }

        // 2. Registrar hora real del servidor
        const horaLlegada = new Date();
        const inicioVentana = new Date(pedido.inicioVentana);

        // 3. Consultar tolerancias dinámicas en la colección de parámetros
        const paramAnticipado = await Parametro.findOne({ clave: 'TOLERANCIA_ANTICIPADO', activo: true });
        const paramTardio = await Parametro.findOne({ clave: 'TOLERANCIA_TARDIO', activo: true });

        const minAnticipado = paramAnticipado ? parseInt(paramAnticipado.valor) : 30;
        const minTardio = paramTardio ? parseInt(paramTardio.valor) : 15;

        // 4. Calcular diferencia de tiempo en minutos
        const difMinutos = (horaLlegada.getTime() - inicioVentana.getTime()) / 60000;

        // 5. Clasificar puntualidad base
        let estadoPuntualidad = 'A TIEMPO';
        
        if (difMinutos < -minAnticipado) {
            estadoPuntualidad = 'ANTICIPADO';
        } else if (difMinutos > minTardio) {
            estadoPuntualidad = 'TARDÍO';
        }

        // ---------------------------------------------------------------------------
// 6. SPRINT 6: LÓGICA DE SATURACIÓN Y ENCOLAMIENTO DINÁMICO
// ---------------------------------------------------------------------------
// Contamos cuántos pedidos están físicamente en las bahías descargando
const camionesEnBahia = await Pedido.countDocuments({ estado: 'DESCARGANDO' });

if (camionesEnBahia >= 5) {
    // Si hay 5 o más camiones descargando, la planta está saturada. Va a la cola.
    pedido.estado = 'EN COLA';
    pedido.fechaHoraIngresoCola = horaLlegada;
    pedido.minutosEnEspera = 0;
    
    // Asignamos el puntaje algorítmico base
    if (estadoPuntualidad === 'A TIEMPO') {
        pedido.prioridadCalculada = 100;
    } else if (estadoPuntualidad === 'ANTICIPADO') {
        pedido.prioridadCalculada = 50;
    } else {
        pedido.prioridadCalculada = 10; // TARDÍO
    }
} else {
    // Si hay espacio en la planta, conserva su etiqueta y pasa directo
    pedido.estado = estadoPuntualidad;
    pedido.fechaHoraIngresoCola = null;
    pedido.prioridadCalculada = null;
}
// ---------------------------------------------------------------------------

        // 7. Actualizar la transacción
        pedido.fechaHoraLlegadaReal = horaLlegada;
        pedido.usuarioActualizacion = nombreUsuario;

        await pedido.save();

        // 8. AUDITORÍA RN-14: Registro inmutable de la llegada a caseta
        await registrarEvento(usuarioId, nombreUsuario, 'LLEGADA_REGISTRADA', pedido._id, {
            numeroPedido: pedido.numeroPedido,
            puntualidadOriginal: estadoPuntualidad,
            estadoAsignado: pedido.estado,
            minutosDiferencia: Math.round(difMinutos),
            saturacion: camionesEnBahia >= 5 ? 'SI' : 'NO' 
        });

        res.status(200).json({
            mensaje: `Arribo registrado. Estado Final: ${pedido.estado}`,
            estado: pedido.estado,
            clasificacion: pedido.estado, 
            fechaHoraLlegadaReal: horaLlegada,
            pedido
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar el arribo', error: error.message });
    }
};