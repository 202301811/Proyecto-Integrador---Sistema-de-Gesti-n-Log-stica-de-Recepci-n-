# Sistema de Gestión Logística de Recepción - Gestor de Proveedores MVP

Proyecto Integrador interdisciplinar desarrollado para la Facultad de Economía, Empresa y Negocios FEEN.

## 🚀 Módulos Implementados

### Sprint 0: Módulo de Autenticación y Control de Acceso (RBAC)
- **Seguridad:** Hash asíncrono de contraseñas con bcrypt y generación de tokens JWT con expiración de 24 horas.
- **Control de Acceso:** Validación de roles (Administrador, Coordinador, Operador) y redirección dinámica en el frontend.
- **Persistencia:** Almacenamiento seguro del token en localStorage y flujo de cierre de sesión seguro.

### Sprint 1: Módulo de Ventanas Horarias y Proveedores (Arquitectura MVC)
- **Registro de Proveedores:** Restricción de categorías y validación estricta de datos desde el backend usando express-validator.
- **Integridad Referencial (RN-01):** Prevención de pedidos huérfanos validando la existencia del proveedor en la base de datos antes de programar una cita.
- **Algoritmo de Ventanas Horarias (RN-02):** Sistema de detección de solapamiento. Si una cita choca con otra o está fuera del horario operativo (8:00 AM - 5:00 PM), el sistema bloquea la transacción y sugiere automáticamente **3 ventanas alternativas disponibles**.
- **Protección de Rutas:** Formularios de programación de uso exclusivo para el rol de **Coordinador**.

### Sprint 2: Control de Arribos, Clasificación Temporal y Mantenimientos con Auditoría (HU-02)
- **Arquitectura de Interfaz (Frontend):** Sidebar responsivo e híbrido en Next.js (fijo colapsable en escritorio, Off-Canvas en móviles menores a 992px). Vista de caseta móvil optimizada (360px) con alertas visuales por color.
- **Módulos de Mantenimiento (CRUDs):** Gestión integral de Proveedores, Citas/Pedidos y Parámetros. Inclusión de validación de horarios operativos (07:00 - 17:00 L-S) y gestión dinámica de límites de tolerancia.
- **Motor de Clasificación Temporal:** Endpoint POST `/api/llegadas` que captura la hora del servidor y clasifica automáticamente el estado logístico (A TIEMPO, ANTICIPADO, TARDÍO, AUSENTE).
- **Soft Delete (Borrado Lógico):** Cumplimiento estricto de la política de cero borrado físico. Todas las operaciones de inactivación actualizan la bandera activo: false, filtrando las lecturas GET para mostrar únicamente registros vigentes.

### Sprint 3: Gestión de Gateways, Exclusividad de Carga y Transacciones (HU-03)
- **Autogeneración Correlativa:** Bloqueo de digitación manual del ID de pedido. Generación automática y blindada de códigos correlativos en formato estricto `PED-EQUI[num]-[00000000X]` basado en un parámetro de base de datos configurable dinámicamente.
- **Control Físico y Exclusividad (RN-07 y RN-08):** Gestión de 5 gateways de descarga en base de datos. Implementación de reglas de exclusividad operativas: GW 1 al 4 para carga 'general' y GW 5 exclusivo para 'construcción'.
- **Validaciones de Infraestructura (RN-GW-01 y RN-GW-02):** Restricciones lógicas de negocio que prohíben cambiar a estado 'FUERA DE SERVICIO' o alterar el tipo de carga de una bahía mientras esta se encuentra atendiendo una operación (estado 'OCUPADO').
- **Motor Transaccional de Descargas:** Endpoints de inicialización y finalización de descargas (`POST /api/descargas/...`) que actualizan en cadena (cadena de responsabilidades) los estados de los pedidos (`EN COLA`, `DESCARGANDO`, `FINALIZADO`) y la disponibilidad en tiempo real de la bahía.
- **UI en Tiempo Real:** Tablero interactivo (Dashboard principal) con representación visual semántica por código de colores (Verde = Libre, Rojo = Ocupado, Gris = Fuera de Servicio) para monitoreo logístico.

### Sprint 4: Cierre Transaccional, Auditoría Inmutable y Dashboard de KPIs
- **Atomicidad Transaccional (HU-03 / RN-11):** Cierre del ciclo operativo con cálculo automático de la duración de descargas. Implementación de una regla estricta que impide liberar un gateway sin haber registrado previamente la fecha y hora de finalización en la colección de descargas y actualizado el estado del pedido a `FINALIZADO`.
- **Trazabilidad Inmutable (RN-14):** Implementación de la colección `eventos` para cumplir con los requerimientos de auditoría y seguridad bajo un modelo estricto de solo lectura (INSERT-ONLY) que prohíbe la edición o eliminación física de registros históricos.
- **Dashboard Analítico Logístico:** Motor matemático en el backend utilizando *Aggregation Pipelines* de MongoDB para calcular métricas en tiempo real, conectado a una interfaz visual en Next.js construida con *Recharts*.

### Sprint 5: Gobernanza de Seguridad MFA y Autenticación de Dos Factores
- **Gobernanza Administrativa:** Panel de gestión de usuarios con capacidad de forzar el enrolamiento MFA (Multi-Factor Authentication) mediante un interruptor de seguridad.
- **Enrolamiento TOTP:** Integración nativa con Google Authenticator mediante la generación de secretos criptográficos en Base32 (`speakeasy`) y renderizado de códigos QR.
- **Arquitectura de Tokens en Dos Fases:** Sistema de seguridad de confianza cero reteniendo el login con un `tempToken` de 5 minutos que debe ser canjeado por un JWT definitivo solo tras validar el código de 6 dígitos.

### Sprint 6: Integración de Funcionalidad de Ordenamiento y Cola de Prioridad
- **Motor Algorítmico (Max-Heap):** Implementación de una Cola de Prioridad basada en la estructura de datos Heap Binario para organizar los pedidos en estado `EN COLA` con una complejidad de $O(\log n)$, evaluando la puntualidad (A TIEMPO > ANTICIPADO > TARDÍO) y la hora programada.
- **Política de Envejecimiento (Aging):** Desarrollo de un algoritmo preventivo de inanición (starvation) de pedidos tardíos. Incrementa dinámicamente el peso de prioridad en función de los minutos en espera interactuando con el parámetro `factor_aging_min`.
- **Reevaluación y Promoción Automática (RN-11):** Integración del motor algorítmico al cierre transaccional (`POST /api/descargas/finalizar`). Al liberar una bahía, la API extrae la raíz del Heap y asigna el recurso libre automáticamente al siguiente pedido elegible validando compatibilidad de carga (RN-07 / RN-08).
- **Monitor de Cola en Next.js:** Interfaz visual interactiva que renderiza el orden estricto de la prioridad calculada por el backend. Actualiza de manera asíncrona y reactiva los repuntes de prioridad por Aging y los despachos automáticos a muelle, complementando las métricas de porcentaje operativo logístico.

---

## ⚙️ Instrucciones de Ejecución Local

El orden correcto para iniciar el ecosistema es: Base de Datos -> Servidor Backend -> Cliente Frontend.

### 1. Base de Datos
Asegúrate de tener el servicio de MongoDB iniciado en tu equipo local en el puerto 27017 (puedes verificarlo abriendo MongoDB Compass).

### 2. Servidor Backend
Abre una terminal en la raíz del proyecto y ejecuta los siguientes comandos para instalar dependencias y levantar la API:

    cd backend
    npm install
    node semilla.js  # Ejecutar una sola vez para poblar roles y usuarios por defecto
    npm run dev      # (O utiliza `node index.js` si no tienes configurado nodemon)

*El servidor backend escuchará en http://localhost:4000.*

### 3. Servidor Frontend
Abre una **segunda terminal** paralela en la raíz del proyecto y ejecuta:

    cd frontend
    npm install
    npm run dev

*El aplicativo frontend estará disponible en http://localhost:3000.*

### 4. Credenciales de Prueba
**Contraseña general para todos los usuarios:** Password123!
*(Nota: Para pruebas de creación manual de usuarios, puedes utilizar contraseñas genéricas como `Demo1234!`)*

- **Administrador:** admin@feen.ujmd.edu.sv
- **Coordinador:** coordinador@feen.ujmd.edu.sv *(Utilizar este rol para probar el registro de proveedores, parámetros y programación de citas)*
- **Operador:** operador@feen.ujmd.edu.sv *(Utilizar este rol para el control de caseta)*