const Descarga = require('../models/Descarga');
const Evento = require('../models/Evento');

exports.obtenerDashboardKPIs = async (req, res) => {
    try {
        // KPI 1: Tiempo Promedio de Espera (Desde caseta hasta inicio en muelle)
        const esperaPromedioData = await Descarga.aggregate([
            {
                $lookup: {
                    from: 'pedidos',
                    localField: 'pedidoId',
                    foreignField: '_id',
                    as: 'pedido'
                }
            },
            { $unwind: '$pedido' },
            { $match: { 'pedido.fechaHoraLlegadaReal': { $exists: true } } },
            {
                $project: {
                    esperaMinutos: {
                        $divide: [
                            { $subtract: ['$fechaHoraInicio', '$pedido.fechaHoraLlegadaReal'] },
                            60000 // Convertir milisegundos a minutos
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    promedio: { $avg: '$esperaMinutos' }
                }
            }
        ]);
        const tiempoEsperaPromedio = esperaPromedioData.length > 0 ? Math.round(esperaPromedioData[0].promedio) : 0;

        // KPI 2: Tiempo Promedio de Descarga (General vs Construcción)
        const descargaPorTipo = await Descarga.aggregate([
            {
                $lookup: {
                    from: 'pedidos',
                    localField: 'pedidoId',
                    foreignField: '_id',
                    as: 'pedido'
                }
            },
            { $unwind: '$pedido' },
            { $match: { duracionMinutos: { $exists: true } } },
            {
                $group: {
                    _id: '$pedido.tipoProducto',
                    promedioDescarga: { $avg: '$duracionMinutos' }
                }
            }
        ]);

        // KPI 3: Nivel de Cumplimiento (Leyendo desde la bitácora inmutable RN-14)
        const cumplimiento = await Evento.aggregate([
            { $match: { accion: 'LLEGADA_REGISTRADA' } },
            {
                $group: {
                    _id: '$detalles.estadoAsignado',
                    cantidad: { $sum: 1 }
                }
            }
        ]);

        // KPI 4: Tasa de Ocupación por Muelle (Minutos totales operados por cada GW)
        const ocupacionGateways = await Descarga.aggregate([
            { $match: { duracionMinutos: { $exists: true } } },
            {
                $lookup: {
                    from: 'gateways',
                    localField: 'gatewayId',
                    foreignField: '_id',
                    as: 'gateway'
                }
            },
            { $unwind: '$gateway' },
            {
                $group: {
                    _id: '$gateway.numeroGateway',
                    totalMinutos: { $sum: '$duracionMinutos' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // KPI 5: Volumen Diario de Recepción (Pedidos finalizados por fecha)
        const volumenDiario = await Descarga.aggregate([
            { $match: { fechaHoraFin: { $exists: true } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fechaHoraFin", timezone: "America/El_Salvador" } },
                    totalPedidos: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 } // Mostrar solo los últimos 7 días
        ]);

        res.status(200).json({
            tiempoEsperaPromedio,
            descargaPorTipo,
            cumplimiento,
            ocupacionGateways,
            volumenDiario
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al calcular los KPIs logísticos', error: error.message });
    }
};