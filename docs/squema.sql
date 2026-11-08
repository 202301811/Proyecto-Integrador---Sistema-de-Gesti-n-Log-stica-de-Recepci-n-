-- =============================================================================
-- SISTEMA DE GESTIÓN LOGÍSTICA DE RECEPCIÓN (GESTOR DE PROVEEDORES MVP)
-- PROYECTO INTEGRADOR SINÉRGICO - DDL DE BASE DE DATOS
-- Archivo: schema.sql
-- =============================================================================

-- 1. TABLA: ROLES (RBAC)
CREATE TABLE roles (
    id_rol VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE CHECK (nombre IN ('administrador', 'coordinador', 'operador')),
    descripcion TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: USUARIOS
CREATE TABLE usuarios (
    id_usuario VARCHAR(36) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol VARCHAR(36) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    mfa_obligatorio BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- 3. TABLA: PARAMETROS (Tolerancias, Aging y Configuración Global)
CREATE TABLE parametros (
    id_parametro VARCHAR(36) PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    usuario_creacion VARCHAR(100) NOT NULL,
    usuario_actualizacion VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: PROVEEDORES (Registro de Transportistas)
CREATE TABLE proveedores (
    id_proveedor VARCHAR(36) PRIMARY KEY,
    razon_social VARCHAR(200) NOT NULL,
    identificacion_tributaria VARCHAR(50) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('construcción', 'general')),
    contacto_nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email_contacto VARCHAR(150) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    activo BOOLEAN DEFAULT TRUE,
    usuario_creacion VARCHAR(100) NOT NULL,
    usuario_actualizacion VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA: GATEWAYS (Bahías de Descarga 1 a 5)
CREATE TABLE gateways (
    id_gateway VARCHAR(36) PRIMARY KEY,
    numero_gateway INT NOT NULL UNIQUE CHECK (numero_gateway BETWEEN 1 AND 5),
    tipo_carga_permitida VARCHAR(50) NOT NULL CHECK (tipo_carga_permitida IN ('general', 'construcción')),
    estado VARCHAR(30) DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADO', 'FUERA DE SERVICIO')),
    activo BOOLEAN DEFAULT TRUE,
    usuario_creacion VARCHAR(100) NOT NULL,
    usuario_actualizacion VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA: PEDIDOS (Programación de Citas y Cola de Prioridad)
CREATE TABLE pedidos (
    id_pedido VARCHAR(36) PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE, -- Formato: PED-EQUI03-000000001
    id_proveedor VARCHAR(36) NOT NULL,
    tipo_producto VARCHAR(50) NOT NULL CHECK (tipo_producto IN ('construcción', 'general')),
    fecha_hora_programada TIMESTAMP NOT NULL,
    inicio_ventana TIMESTAMP NOT NULL,
    fin_ventana TIMESTAMP NOT NULL,
    duracion_estimada_minutos INT NOT NULL CHECK (duracion_estimada_minutos > 0),
    fecha_hora_llegada_real TIMESTAMP,
    fecha_hora_ingreso_cola TIMESTAMP,
    minutos_en_espera INT DEFAULT 0,
    prioridad_calculada INT DEFAULT 0,
    estado VARCHAR(30) DEFAULT 'PROGRAMADO' CHECK (estado IN (
        'PROGRAMADO', 'ANTICIPADO', 'A TIEMPO', 'TARDÍO', 
        'AUSENTE', 'EN COLA', 'DESCARGANDO', 'FINALIZADO', 'CANCELADO'
    )),
    activo BOOLEAN DEFAULT TRUE,
    usuario_creacion VARCHAR(100) NOT NULL,
    usuario_actualizacion VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- 7. TABLA: DESCARGAS (Transacción Física de Desembarque en Muelle)
CREATE TABLE descargas (
    id_descarga VARCHAR(36) PRIMARY KEY,
    id_gateway VARCHAR(36) NOT NULL,
    id_pedido VARCHAR(36) NOT NULL,
    id_operador VARCHAR(36),
    fecha_hora_inicio TIMESTAMP NOT NULL,
    fecha_hora_fin TIMESTAMP,
    duracion_minutos INT,
    activo BOOLEAN DEFAULT TRUE,
    usuario_creacion VARCHAR(100) NOT NULL,
    usuario_actualizacion VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_descarga_gateway FOREIGN KEY (id_gateway) REFERENCES gateways(id_gateway),
    CONSTRAINT fk_descarga_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_descarga_operador FOREIGN KEY (id_operador) REFERENCES usuarios(id_usuario)
);

-- 8. TABLA: EVENTOS (Bitácora Inmutable de Auditoría - RN-14 y Checksum)
CREATE TABLE eventos (
    id_evento VARCHAR(36) PRIMARY KEY,
    id_usuario VARCHAR(36) NOT NULL,
    id_pedido VARCHAR(36),
    accion VARCHAR(50) NOT NULL CHECK (accion IN (
        'LLEGADA_REGISTRADA', 'GATEWAY_ASIGNADO', 'DESCARGADA_INICIADA', 
        'DESCARGA_FINALIZADA', 'CITA_REPROGRAMADA', 'GATEWAY_MANTENIMIENTO',
        'INGRESO_COLA', 'AGING_APLICADO', 'PROMOCION_AUTOMATICA_GATEWAY'
    )),
    detalles_json TEXT, -- Almacén de metadata
    suma_control VARCHAR(64) NOT NULL, -- Checksum SHA-256 para integridad de auditoría
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuario_creacion VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_evento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_evento_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
);
