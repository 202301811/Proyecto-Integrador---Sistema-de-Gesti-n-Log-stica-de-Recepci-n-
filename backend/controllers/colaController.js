const Pedido = require('../models/Pedido');
const Parametro = require('../models/Parametro');
const { MaxHeap, calcularPrioridad } = require('../utils/ColaPrioridad')

// GET /api/cola -> Retorna la lista ordenada en O(log n)
exports.obtenerCola = async (req, res) => {
    try {
        // 1. Extraemos todos los pedidos que están esperando
        const pedidosEnCola = await Pedido.find({ estado: 'EN COLA' }).populate('proveedorId', 'nombre razonSocial');

        // 2. Instanciamos el motor algorítmico (Max-Heap)
        const heap = new MaxHeap();
        
        // 3. Insertamos cada pedido (Complejidad O(log n) por inserción)
        pedidosEnCola.forEach(pedido => heap.insert(pedido));

        // 4. Extraemos toda la cola ya ordenada matemáticamente
        const pedidosOrdenados = heap.sort();

        res.status(200).json(pedidosOrdenados);
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