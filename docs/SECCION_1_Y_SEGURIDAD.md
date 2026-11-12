Acta de Constitución del Proyecto (Project Charter)

    Nombre Oficial: Sistema de Gestión Logística de Recepción y Desembarque (SumaControl MVP).
    Patrocinadores Institucionales (PO): Ing. Jorge Edwin Machado Leiva (Cátedra EDA 0) / Ing. Milton Aníbal Pineda Romero (Cátedra PON 0).
    Equipo de Desarrollo (Scrum Team): René Rafael Palacios (Scrum Master), José Jafet Hernández (Dev Lead), Juan René Arévalo (Dev).
    Propósito del Proyecto: Erradicar el caos operativo y los cuellos de botella generados por la llegada desordenada de transportes y la mezcla ineficiente de cargas generales con materiales de construcción en el centro logístico SumaControl.
    Objetivos SMART del Proyecto:
        Específico: Automatizar la programación de citas, el cálculo de puntualidad y la asignación inteligente de andenes (Gateways 1 a 5).
        Medible: Reducir la saturación de bahías en al menos un 40% y garantizar tiempos de respuesta de asignación menores a 1.5 segundos.
        Alcanzable: Desarrollar e integrar el MVP en 16 semanas cumpliendo con los estándares de calidad IEEE 830 / ISO 29148.
        Relevante: Garantizar la exclusividad del Gateway 5 para construcción (RN-08) y prevenir la inanición de camiones tardíos mediante Aging algorítmico (RN-12).
        Temporal: Puesta en marcha y Go-Live en ambiente productivo local en el Ciclo 2-2026.
    Supuestos Críticos: Disponibilidad ininterrumpida de la red local cableada Cat 6A en cuarto MDF y persistencia continua del servicio MongoDB.
    Restricciones Principales: Uso obligatorio de la pila tecnológica definida (Next.js, Express, MongoDB, Ubuntu Server) y trazabilidad completa de commits y PRs en GitHub.


Factibilidad Técnica
•	Disponibilidad Tecnológica: El stack seleccionado está compuesto en un 100% por tecnologías maduras de estándar industrial: Next.js (React) en frontend, Node.js con Express en backend y MongoDB para persistencia NoSQL.
•	Compatibilidad de Infraestructura: El despliegue se ejecuta sobre máquinas virtuales con Ubuntu Server, utilizando el sistema de archivos XFS sobre volúmenes lógicos (LVM), garantizando escalamiento en caliente y aislamiento del directorio /var.
•	Capacidades del Equipo: El equipo de desarrollo domina la arquitectura desacoplada Cliente-Servidor, la gestión de APIs RESTful asíncronas y la implementación algorítmica de Colas de Prioridad en memoria (O(logn)) adquirida en las asignaturas integradoras (PON 0 y EDA 0).
•	Dictamen: TÉCNICAMENTE FACTIBLE.

Factibilidad Económica (Análisis Costo-Beneficio)
•	Inversión Inicial en Licenciamiento (CAPEX Software): $0.00 USD. Todo el ecosistema de software empleado es de código abierto bajo licencia MIT o Apache 2.0 (Ubuntu, Node.js, Express, Next.js, MongoDB Community, Git/GitHub for Education).
•	Costos de Infraestructura y Hardware: Utilización de infraestructura de cómputo local existente en el centro logístico (servidor On-Premise en cuarto MDF y 2 tablets industriales para caseta de garita).
•	Retorno de Inversión y Ahorro Operativo: 
o	Reducción estimada de 45 minutos en el tiempo de espera por camión.
o	Eliminación de multas y sobrecostos por estadía indebida de transportes en patio (~$1,200 USD mensuales).
o	Automatización del 100% de la clasificación de puntualidad, ahorrando 15 horas-hombre semanales de supervisión manual.
o	Período de Recuperación de Inversión (Payback): Inmediato (< 1 mes), al apoyarse en costos marginales de implementación interna.
•	Dictamen: ECONÓMICAMENTE FACTIBLE.

Factibilidad Operativa
•	Aceptabilidad por Usuarios Finales: Las interfaces de usuario fueron diseñadas bajo principios de usabilidad ergonómica (Bootstrap y código semántico de colores: Verde = Libre, Rojo = Ocupado, Ámbar = En cola). La operación de garita requiere únicamente la digitación del correlativo PED-EQUI03-00000001 y un clic de confirmación (< 30 segundos por unidad).
•	Gestión del Cambio Organizacional: Se definió una Matriz de Capacitación escalonada (4 horas para operadores y 6 horas para coordinadores) y un Protocolo de Rollback probado (< 11 minutos) que permite operar con plan de contingencia sin detener la bodega.
•	Dictamen: OPERATIVAMENTE FACTIBLE.

Diagrama de Causa-Efecto de Ishikawa (Análisis de Causa Raíz)

Representa de forma exhaustiva las causas que originan el problema central: Congestionamiento y Cuello de Botella en las Bahías de Descarga.

flowchart LR
    subgraph METODOS [Métodos y Procesos]
        M1[Falta de ventanas horarias obligatorias]
        M2[Evaluación subjetiva de puntualidad]
        M3[Criterio manual para asignar andenes]
    end

    subgraph MANO_OBRA [Personal y Comunicación]
        P1[Descoordinación entre Garita y Almacén]
        P2[Errores al registrar códigos de pedido]
        P3[Falta de visibilidad del estado de bahías]
    end

    subgraph MAQUINARIA [Tecnología y Software]
        T1[Inexistencia de un sistema centralizado]
        T2[Uso de hojas de papel y hojas de cálculo]
        T3[Ausencia de motor de colas de espera]
    end

    subgraph MEDIO_AMBIENTE [Entorno y Bahías]
        E1[Mezcla de carga pesada con abarrotes]
        E2[Ocupación imprevista del Gateway 5]
        E3[Llegadas simultáneas en horas pico]
    end

    PROBLEMA((CONGESTIONAMIENTO Y<br>CUELLOS DE BOTELLA EN<br>BAHÍAS DE DESCARGA))

    METODOS --> PROBLEMA
    MANO_OBRA --> PROBLEMA
    MAQUINARIA --> PROBLEMA
    MEDIO_AMBIENTE --> PROBLEMA

    3.3 Diagrama de Procesos de Negocio BPMN (Flujo de Recepción y Desembarque)

Modela el proceso extremo a extremo (End-to-End), desde el agendamiento hasta la liberación de la bahía:

sequenceDiagram
    autonumber
    actor Prov as Proveedor / Transportista
    actor Coord as Coordinador Logístico
    actor Garita as Operador de Garita
    participant Sys as Sistema SumaControl (Next/Express)
    participant Engine as Motor EDA 0 (Heap/Aging)
    participant GW as Bahías de Descarga (Gateways)

    Note over Prov,Coord: 1. Fase de Agendamiento Previo
    Coord->>Sys: Programar Cita (Proveedor, Insumo, Ventana Horaria)
    Sys-->>Coord: Genera Código PED-EQUI03-00000001 (Estado: PROGRAMADO)

    Note over Prov,Garita: 2. Fase de Arribo a Caseta Física
    Prov->>Garita: Presenta código de pedido al llegar
    Garita->>Sys: Ingresa código y captura timestamp real (POST /api/llegadas)
    Sys->>Sys: Evalúa tolerancia vs ventana (RN-04)
    alt Llegada <= 15 min
        Sys-->>Garita: Clasifica: A TIEMPO (Indicador Verde)
    else Llegada > 15 min
        Sys-->>Garita: Clasifica: TARDÍO (Indicador Ámbar / Penalización)
    end

    Note over Garita,GW: 3. Fase de Asignación y Descarga
    Garita->>Sys: Solicitar asignación de bahía
    alt Carga de Construcción
        Sys->>GW: Consulta disponibilidad exclusiva de Gateway 5 (RN-08)
    else Carga General
        Sys->>GW: Consulta disponibilidad de Gateways 1 al 4
    end

    alt Bahía Disponible
        Sys->>GW: Ocupa Bahía y cambia estado a ROJO
        Sys-->>Garita: Asigna Gateway físico al transporte
        Garita-->>Prov: Autoriza ingreso a rampa
    else Bahías Saturadas
        Sys->>Engine: Encola en Priority Queue MinHeap O(log n)
        Engine-->>Garita: Confirma turno en cola de espera
        Garita-->>Prov: Dirige a zona de espera de patio
        Note over Engine: Monitoreo continuo de Aging para evitar inanición
    end

    Note over GW,Coord: 4. Finalización de Descarga
    GW->>Sys: Operador marca "Finalizar Descarga" (PUT /api/gateways/:id/liberar)
    Sys->>GW: Libera Bahía (Estado: LIBRE / Verde)
    Sys->>Sys: Registra evento inmutable en Bitácora con Checksum SHA-256 (RN-14)
    Sys->>Engine: Dispara reevaluación del siguiente camión en cola
