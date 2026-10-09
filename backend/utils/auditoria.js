const Evento = require('../models/Evento');
const mongoose = require('mongoose');

exports.registrarEvento = async (usuarioId, nombreUsuario, accion, pedidoId = null, detalles = {}) => {
    try {
        // Validamos si usuarioId es válido, si no, inyectamos un ObjectId por defecto válido
        const idValido = (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) 
            ? usuarioId 
            : new mongoose.Types.ObjectId('000000000000000000000000'); // ID genérico de sistema

        const nuevoEvento = new Evento({
            usuarioId: idValido,
            pedidoId: pedidoId,
            accion: accion,
            detalles: detalles,
            usuarioCreacion: nombreUsuario || 'Sistema'
        });
        
        await nuevoEvento.save();
        console.log(`[Auditoría] Evento guardado: ${accion}`);
    } catch (error) {
        console.error(`[Error de Auditoría] No se pudo guardar el evento ${accion}:`, error.message);
    }
};