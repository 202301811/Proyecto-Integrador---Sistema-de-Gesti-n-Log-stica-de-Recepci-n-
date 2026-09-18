const Pedido = require('../models/Pedido');
const Proveedor = require('../models/Proveedor');

// Definición del horario logístico (Ejemplo: 8:00 AM a 5:00 PM)
const HORA_APERTURA = 8;
const HORA_CIERRE = 17;

exports.crearPedido = async (req, res) => {
    try {
        const { numeroPedido, proveedorId, tipoProducto, fechaHoraProgramada, duracionEstimadaMinutos } = req.body;

        // 1. RN-01: Integridad referencial
        // MongoDB no tiene llaves foráneas nativas, verificamos la existencia manualmente
        const proveedorExiste = await Proveedor.findById(proveedorId);
        if (!proveedorExiste) {
            return res.status(404).json({ 
                mensaje: 'Error (RN-01): El proveedorId enviado no corresponde a un proveedor registrado.' 
            });
        }

        // 2. Cálculos de marcas temporales de la ventana
        const inicioVentana = new Date(fechaHoraProgramada);
        const finVentana = new Date(inicioVentana.getTime() + duracionEstimadaMinutos * 60000); // 60000 ms = 1 minuto

        // Validar que la cita esté dentro del horario operativo[cite: 3]
        if (inicioVentana.getHours() < HORA_APERTURA || finVentana.getHours() > HORA_CIERRE) {
            return res.status(400).json({ 
                mensaje: `Fuera de horario operativo. El centro logístico atiende de ${HORA_APERTURA}:00 a ${HORA_CIERRE}:00.` 
            });
        }

        // 3. RN-02: Detección de solapamiento
        // Un cruce ocurre si el inicio de un pedido existente es menor al fin del nuevo, 
        // Y el fin del existente es mayor al inicio del nuevo.
        const choque = await Pedido.findOne({
            $and: [
                { inicioVentana: { $lt: finVentana } },
                { finVentana: { $gt: inicioVentana } },
                { estado: { $ne: 'CANCELADO' } } // Ignorar pedidos cancelados
            ]
        });

        if (choque) {
            // 4. Algoritmo de alternativas (Generar 3 opciones sin solapamiento)[cite: 3]
            let alternativas = [];
            let posibleInicio = new Date(inicioVentana);

            // Búsqueda iterativa hacia adelante saltando de hora en hora
            while (alternativas.length < 3) {
                posibleInicio = new Date(posibleInicio.getTime() + 60 * 60000); // Sumar 60 minutos
                const posibleFin = new Date(posibleInicio.getTime() + duracionEstimadaMinutos * 60000);

                // Verificar si la alternativa sigue dentro del horario operativo de ese día
                if (posibleInicio.getHours() >= HORA_APERTURA && posibleFin.getHours() <= HORA_CIERRE) {
                    const cruceAlternativa = await Pedido.findOne({
                        $and: [
                            { inicioVentana: { $lt: posibleFin } },
                            { finVentana: { $gt: posibleInicio } },
                            { estado: { $ne: 'CANCELADO' } }
                        ]
                    });

                    // Si no choca con nada en la base de datos, es una alternativa válida
                    if (!cruceAlternativa) {
                        alternativas.push({
                            fechaHoraSugerida: posibleInicio,
                            finVentanaSugerida: posibleFin
                        });
                    }
                } else if (posibleInicio.getHours() > HORA_CIERRE) {
                    // Si se acaba el día, saltar al día siguiente a la hora de apertura
                    posibleInicio.setDate(posibleInicio.getDate() + 1);
                    posibleInicio.setHours(HORA_APERTURA, 0, 0, 0);
                }
            }

            return res.status(409).json({
                mensaje: 'Error (RN-02): La ventana horaria solicitada se solapa con un pedido existente.',
                alternativasDisponibles: alternativas
            });
        }

        // 5. Creación del documento si supera todas las reglas
        const nuevoPedido = new Pedido({
            numeroPedido,
            proveedorId,
            tipoProducto,
            fechaHoraProgramada: inicioVentana,
            inicioVentana,
            finVentana,
            duracionEstimadaMinutos
            // El estado 'PROGRAMADO' se asigna automáticamente por el default del modelo[cite: 3]
        });

        await nuevoPedido.save();
        res.status(201).json({ 
            mensaje: 'Pedido programado exitosamente', 
            pedido: nuevoPedido 
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al procesar el pedido', error: error.message });
    }
};

// Endpoint GET para consumir los pedidos en el frontend[cite: 3]
exports.obtenerPedidos = async (req, res) => {
    try {
        // El populate trae los datos del proveedor cruzando el proveedorId
        const pedidos = await Pedido.find().populate('proveedorId', 'razonSocial categoria');
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
    }
};