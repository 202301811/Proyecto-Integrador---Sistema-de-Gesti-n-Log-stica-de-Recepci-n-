--DER

erDiagram
    ROLES ||--o{ USUARIOS : "asigna permisos a"
    USUARIOS ||--o{ DESCARGAS : "opera"
    USUARIOS ||--o{ EVENTOS : "dispara acción en"
    PROVEEDORES ||--o{ PEDIDOS : "suministra"
    PEDIDOS ||--o{ DESCARGAS : "se ejecuta en"
    PEDIDOS ||--o{ EVENTOS : "registrado en"
    GATEWAYS ||--o{ DESCARGAS : "alberga muelle"
    
    ROLES {
        string id_rol PK
        string nombre
        string descripcion
    }
    USUARIOS {
        string id_usuario PK
        string nombres
        string email
        string password_hash
        string id_rol FK
        boolean mfa_obligatorio
    }
    PROVEEDORES {
        string id_proveedor PK
        string razon_social
        string identificacion_tributaria UK
        string categoria
    }
    GATEWAYS {
        string id_gateway PK
        int numero_gateway UK
        string tipo_carga_permitida
        string estado
    }
    PEDIDOS {
        string id_pedido PK
        string numero_pedido UK
        string id_proveedor FK
        datetime fecha_hora_programada
        string estado
        int prioridad_calculada
    }
    DESCARGAS {
        string id_descarga PK
        string id_gateway FK
        string id_pedido FK
        string id_operador FK
        datetime fecha_hora_inicio
        datetime fecha_hora_fin
        int duracion_minutos
    }
    EVENTOS {
        string id_evento PK
        string id_usuario FK
        string id_pedido FK
        string accion
        string suma_control
        datetime fecha_hora
    }
    PARAMETROS {
        string id_parametro PK


--Despliegue 4 capas

graph TD
    subgraph Capa_1_Presentacion [Capa 1: Dispositivos de Cliente / Presentación]
        C1[Navegador Web Desktop - Coordinador / Admin]
        C2[Dispositivo Móvil / Tablet - Operador Caseta / Patio]
        C3[Google Authenticator - TOTP 2FA]
    end

    subgraph Capa_2_Frontend [Capa 2: Servidor Frontend - Next.js App Router]
        F1[Next.js Server - Node.js Runtime :3000]
        F2[Componentes React / Bootstrap / Recharts]
        F3[Cliente Fetch + Manejo de LocalStorage JWT]
    end

    subgraph Capa_3_Backend [Capa 3: Capa de Lógica de Negocio y Algoritmos - Express.js]
        B1[API REST Express.js :4000]
        B2[Middleware Auth JWT & RBAC & verifyTempToken]
        B3[Motor Algorítmico Max-Heap & Factor Aging O log n]
        B4[Validador de Horarios y Solapamiento RN-02]
        B5[Servicio de Auditoría Inmutable RN-14]
    end

    subgraph Capa_4_Persistencia [Capa 4: Capa de Persistencia y Datos]
        DB1[(MongoDB Local :27017)]
        DB2[Colección Usuarios & Roles]
        DB3[Colección Proveedores & Pedidos]
        DB4[Colección Gateways & Descargas]
        DB5[Colección Eventos Inmutables - Checksum]
        DB6[Colección Parámetros Dinámicos]
    end

    C1 -->|HTTPS / HTTP :3000| F1
    C2 -->|HTTPS / HTTP :3000| F1
    C3 -.->|Código 6 dígitos TOTP| F1
    F3 -->|REST API JSON / Bearer JWT :4000| B1
    B1 --> B2
    B2 --> B3
    B2 --> B4
    B2 --> B5
    B3 -->|Mongoose ODM Drivers| DB1
    B4 -->|Mongoose ODM Drivers| DB1
    B5 -->|Mongoose ODM Drivers| DB1
        string clave UK
        string valor
    }
