/**
 * Módulo de Lógica Pura para Pruebas Unitarias de QA (SumaControl - Equipo 3)
 * Evalúa RN-04 (Tolerancia) y RN-08 (Exclusividad de Gateways)
 */

// RN-04: Evaluación de Tolerancia de Arribo (15 minutos configurables)
function evaluarTolerancia(horaProgramada, horaLlegada, toleranciaMinutos = 15) {
    const [hProg, mProg] = horaProgramada.split(':').map(Number);
    const [hLleg, mLleg] = horaLlegada.split(':').map(Number);

    const minutosProg = hProg * 60 + mProg;
    const minutosLleg = hLleg * 60 + mLleg;
    const diferenciaMinutos = minutosLleg - minutosProg;

    if (diferenciaMinutos < 0) {
        return { estado: 'ANTICIPADO', diferenciaMinutos };
    } else if (diferenciaMinutos <= toleranciaMinutos) {
        return { estado: 'A TIEMPO', diferenciaMinutos };
    } else {
        return { estado: 'TARDÍO', diferenciaMinutos };
    }
}

// RN-08: Validación de Compatibilidad de Carga con Bahías (Gateways)
function validarCompatibilidadGateway(tipoGateway, tipoCarga) {
    const cargaNormalizada = tipoCarga.toUpperCase();
    const gwNormalizado = tipoGateway.toUpperCase();

    // El Gateway de Construcción solo admite carga de Construcción
    if (gwNormalizado === 'CONSTRUCCION' && cargaNormalizada !== 'CONSTRUCCION') {
        throw new Error('Incompatibilidad de Carga: Gateway de construcción no admite carga general');
    }

    // Gateways Generales no admiten materiales pesados de construcción
    if (gwNormalizado === 'GENERAL' && cargaNormalizada === 'CONSTRUCCION') {
        throw new Error('Incompatibilidad de Carga: Bahías generales no admiten carga pesada de construcción (RN-08)');
    }

    return true; // Asignación compatible
}

// RN-13 & RN-GW-01: Regla de Mantenimiento de Bahías
function cambiarEstadoMantenimiento(estadoActualGateway) {
    if (estadoActualGateway.toUpperCase() === 'OCUPADO') {
        throw new Error('Gateway Ocupado (RN-GW-01): Prohibido pasar a mantenimiento una bahía en operación');
    }
    return 'FUERA_DE_SERVICIO';
}

// RN-01: Generación de Correlativo Oficial
function autogenerarNumeroPedido(equipoId, correlativoActual) {
    const pad = String(correlativoActual).padStart(8, '0');
    return `PED-EQUI${equipoId}-${pad}`;
}

module.exports = {
    evaluarTolerancia,
    validarCompatibilidadGateway,
    cambiarEstadoMantenimiento,
    autogenerarNumeroPedido
};