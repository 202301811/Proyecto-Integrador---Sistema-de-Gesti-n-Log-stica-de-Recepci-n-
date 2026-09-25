const Pedido = require('../models/Pedido');
const Parametro = require('../models/Parametro');

exports.registrarLlegada = async (req, res) => {
    try {
        const { numeroPedido } = req.body;
        const nombreUsuario = req.usuario?.nombre || 'Operador Caseta';

        // 1. Buscar el pedido programado
        const pedido = await Pedido.findOne({ numeroPedido, activo: true });
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado o inactivo.' });
        }
        if (pedido.estado !== 'PROGRAMADO') {
            return res.status(400).json({ mensaje: `El pedido ya fue procesado. Estado actual: ${pedido.estado}` });
        }

        // 2. Registrar hora real del servidor[cite: 10]
        const horaLlegada = new Date();
        const inicioVentana = new Date(pedido.inicioVentana);

        // 3. Consultar tolerancias dinámicas en la colección de parámetros[cite: 10]
        const paramAnticipado = await Parametro.findOne({ clave: 'TOLERANCIA_ANTICIPADO', activo: true });
        const paramTardio = await Parametro.findOne({ clave: 'TOLERANCIA_TARDIO', activo: true });

        // Si no existen los parámetros, usamos 30 min (anticipado) y 15 min (tardío) por defecto
        const minAnticipado = paramAnticipado ? parseInt(paramAnticipado.valor) : 30;
        const minTardio = paramTardio ? parseInt(paramTardio.valor) : 15;

        // 4. Calcular diferencia de tiempo en minutos (Negativo = antes de la hora, Positivo = después de la hora)
        const difMinutos = (horaLlegada.getTime() - inicioVentana.getTime()) / 60000;

        // 5. Clasificar puntualidad
        let estadoPuntualidad = 'A TIEMPO';
        
        if (difMinutos < -minAnticipado) {
            estadoPuntualidad = 'ANTICIPADO';
        } else if (difMinutos > minTardio) {
            estadoPuntualidad = 'TARDÍO';
        }

        // 6. Actualizar la transacción en el documento original del pedido[cite: 10]
        pedido.fechaHoraLlegadaReal = horaLlegada;
        pedido.estado = estadoPuntualidad;
        pedido.usuarioActualizacion = nombreUsuario;

        await pedido.save();

        res.status(200).json({
            mensaje: `Arribo registrado en caseta. Clasificación: ${estadoPuntualidad}`,
            estado: estadoPuntualidad,
            fechaHoraLlegadaReal: horaLlegada,
            pedido
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar el arribo', error: error.message });
    }
};