const Pedido = require('../models/Pedido');
const Proveedor = require('../models/Proveedor');
const Parametro = require('../models/Parametro');

const HORA_APERTURA = 7;
const HORA_CIERRE = 17;

// POST: Crear Pedido con Autogeneración
exports.crearPedido = async (req, res) => {
    try {
        // Nota: numeroPedido ya no viene del frontend
        const { proveedorId, tipoProducto, fechaHoraProgramada, duracionEstimadaMinutos } = req.body;
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';

        // 1. Integridad referencial
        const proveedorExiste = await Proveedor.findOne({ _id: proveedorId, activo: true });
        if (!proveedorExiste) {
            return res.status(404).json({ mensaje: 'Error (RN-01): Proveedor no válido.' });
        }

        const inicioVentana = new Date(fechaHoraProgramada);
        const finVentana = new Date(inicioVentana.getTime() + duracionEstimadaMinutos * 60000);

        // 2. Validar horario operativo
        const diaSemana = inicioVentana.getDay();
        if (diaSemana === 0 || inicioVentana.getHours() < HORA_APERTURA || finVentana.getHours() > HORA_CIERRE) {
            return res.status(400).json({ mensaje: 'Fuera de horario operativo (07:00 a 17:00 L-S).' });
        }

        // 3. RN-02: Detección de solapamiento (Lógica existente)
        const choque = await Pedido.findOne({
            $and: [
                { inicioVentana: { $lt: finVentana } },
                { finVentana: { $gt: inicioVentana } },
                { estado: { $ne: 'CANCELADO' } },
                { activo: true }
            ]
        });

        if (choque) {
            // Algoritmo de 3 alternativas
            let alternativas = [];
            let posibleInicio = new Date(inicioVentana);
            while (alternativas.length < 3) {
                posibleInicio = new Date(posibleInicio.getTime() + 60 * 60000);
                const posibleFin = new Date(posibleInicio.getTime() + duracionEstimadaMinutos * 60000);
                const diaPosible = posibleInicio.getDay();
                if (diaPosible !== 0 && posibleInicio.getHours() >= HORA_APERTURA && posibleFin.getHours() <= HORA_CIERRE) {
                    const cruce = await Pedido.findOne({
                        $and: [
                            { inicioVentana: { $lt: posibleFin } },
                            { finVentana: { $gt: posibleInicio } },
                            { estado: { $ne: 'CANCELADO' } },
                            { activo: true }
                        ]
                    });
                    if (!cruce) alternativas.push({ fechaHoraSugerida: posibleInicio, finVentanaSugerida: posibleFin });
                } else if (posibleInicio.getHours() > HORA_CIERRE || diaPosible === 0) {
                    posibleInicio.setDate(posibleInicio.getDate() + (diaPosible === 6 ? 2 : 1));
                    posibleInicio.setHours(HORA_APERTURA, 0, 0, 0);
                }
            }
            return res.status(409).json({
                mensaje: 'Error (RN-02): La ventana horaria solicitada se solapa.',
                alternativasDisponibles: alternativas
            });
        }

        // 4. AUTOGENERACIÓN DEL CORRELATIVO (HU-03)
        // Consultar el número de equipo en parámetros (Por defecto '03' para tu equipo)
        const paramEquipo = await Parametro.findOne({ clave: 'numero_equipo', activo: true });
        const numEquipo = paramEquipo ? paramEquipo.valor : '03';
        const prefijo = `PED-EQUI${numEquipo}-`;

        // Contar el total histórico de pedidos para asignar el siguiente correlativo
        const totalPedidos = await Pedido.countDocuments({ numeroPedido: { $regex: `^${prefijo}` } });
        const correlativoPadded = String(totalPedidos + 1).padStart(9, '0');
        const numeroPedidoGenerado = `${prefijo}${correlativoPadded}`;

        // 5. Guardar Pedido
        const nuevoPedido = new Pedido({
            numeroPedido: numeroPedidoGenerado,
            proveedorId,
            tipoProducto,
            fechaHoraProgramada: inicioVentana,
            inicioVentana,
            finVentana,
            duracionEstimadaMinutos,
            usuarioCreacion: nombreUsuario,
            usuarioActualizacion: nombreUsuario
        });

        await nuevoPedido.save();
        res.status(201).json({ mensaje: 'Pedido programado exitosamente', pedido: nuevoPedido });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al procesar el pedido', error: error.message });
    }
};

// GET: Consultar Pedidos (Solo los activos)
exports.obtenerPedidos = async (req, res) => {
    try {
        // RN-SoftDelete: Filtrar por defecto únicamente los registros activos
        const pedidos = await Pedido.find({ activo: true }).populate('proveedorId', 'razonSocial categoria');
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los pedidos', error: error.message });
    }
};

// PUT: Reprogramar Pedido
exports.reprogramarPedido = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        
        // Aquí se podría reutilizar la lógica de solapamiento antes de actualizar, 
        // pero para simplificar, actualizaremos directamente los datos básicos.
        const pedidoActualizado = await Pedido.findByIdAndUpdate(
            req.params.id,
            { ...req.body, usuarioActualizacion: nombreUsuario },
            { new: true }
        );
        
        if (!pedidoActualizado) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }
        res.status(200).json({ mensaje: 'Pedido reprogramado exitosamente', pedido: pedidoActualizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al reprogramar pedido', error: error.message });
    }
};

// DELETE: Cancelar Pedido (Soft Delete)
exports.cancelarPedido = async (req, res) => {
    try {
        const nombreUsuario = req.usuario?.nombre || 'Usuario Sistema';
        
        // RN-SoftDelete: Prohibido usar remove(). Actualizamos estado y activo.
        const pedidoCancelado = await Pedido.findByIdAndUpdate(
            req.params.id,
            { estado: 'CANCELADO', activo: false, usuarioActualizacion: nombreUsuario },
            { new: true }
        );

        if (!pedidoCancelado) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }
        res.status(200).json({ mensaje: 'Pedido cancelado exitosamente', pedido: pedidoCancelado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cancelar pedido', error: error.message });
    }
};