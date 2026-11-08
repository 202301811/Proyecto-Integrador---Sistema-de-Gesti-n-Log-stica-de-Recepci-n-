const Pedido = require('../models/Pedido');
const Parametro = require('../models/Parametro');
const { MaxHeap, calcularPrioridad } = require('../utils/ColaPrioridad')

// GET /api/cola -> Retorna la lista ordenada en O(log n)
exports.obtenerCola = async (req, res) => {
    try {
        // Traemos los pedidos con el proveedor poblado correctamente desde la BD
        const pedidosEnCola = await Pedido.find({ estado: 'EN COLA' }).populate('proveedorId');
        
        res.status(200).json(pedidosEnCola);
    } catch (error) {
        console.error('Error al obtener la cola:', error);
        res.status(500).json({ mensaje: 'Error al obtener la cola de prioridad' });
    }
};

// POST /api/cola/reevaluar -> Ejecuta la política de Aging
exports.reevaluarCola = async (req, res) => {
    try {
        // 1. Obtener dinámicamente el parámetro de Aging desde la BD
        const parametroAging = await Parametro.findOne({ clave: 'factor_aging_min' });
        const factorAging = parametroAging ? parseInt(parametroAging.valor) : 5;

        // 2. Buscar vehículos en espera
        const pedidosEnCola = await Pedido.find({ estado: 'EN COLA' });
        const ahora = new Date();
        let actualizados = 0;

        // 3. Recálculo dinámico de prioridades (Anti-Starvation)
        for (let pedido of pedidosEnCola) {
            if (pedido.fechaHoraIngresoCola) {
                // Cuántos minutos lleva esperando
                const difMilisegundos = ahora - pedido.fechaHoraIngresoCola;
                const minutosEspera = Math.floor(difMilisegundos / 60000);
                pedido.minutosEnEspera = minutosEspera;

                // Enviar al motor para recalcular peso
                pedido.prioridadCalculada = calcularPrioridad(pedido.estado, minutosEspera, factorAging);
                
                await pedido.save();
                actualizados++;
            }
        }

        res.status(200).json({
            mensaje: `Se reevaluaron ${actualizados} pedidos en la cola exitosamente.`,
            factorAplicado: factorAging
        });
    } catch (error) {
        console.error('Error al reevaluar cola:', error);
        res.status(500).json({ mensaje: 'Error al aplicar política de Aging' });
    }
};