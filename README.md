# Sistema de Gestión Logística de Recepción - Gestor de Proveedores MVP

Proyecto Integrador interdisciplinar desarrollado para la Facultad de Economía, Empresa y Negocios FEEN.


## 🚀 Módulos Implementados

### Sprint 0: Módulo de Autenticación y Control de Acceso (RBAC)
* **Seguridad:** Hash asíncrono de contraseñas con bcrypt y generación de tokens JWT con expiración de 24 horas.
* **Control de Acceso:** Validación de roles (Administrador, Coordinador, Operador) y redirección dinámica en el frontend.
* **Persistencia:** Almacenamiento seguro del token en localStorage y flujo de cierre de sesión seguro.

### Sprint 1: Módulo de Ventanas Horarias y Proveedores (Arquitectura MVC)
* **Registro de Proveedores:** Restricción de categorías y validación estricta de datos desde el backend usando express-validator.
* **Integridad Referencial (RN-01):** Prevención de pedidos huérfanos validando la existencia del proveedor en la base de datos antes de programar una cita.
* **Algoritmo de Ventanas Horarias (RN-02):** Sistema de detección de solapamiento. Si una cita choca con otra o está fuera del horario operativo (8:00 AM - 5:00 PM), el sistema bloquea la transacción y sugiere automáticamente **3 ventanas alternativas disponibles**.
* **Protección de Rutas:** Formularios de programación de uso exclusivo para el rol de **Coordinador**.

### Sprint 2: Control de Arribos, Clasificación Temporal y Mantenimientos con Auditoría (HU-02)
* **Arquitectura de Interfaz (Frontend):** Sidebar responsivo e híbrido en Next.js (fijo colapsable en escritorio, Off-Canvas en móviles menores a 992px). Vista de caseta móvil optimizada (360px) con alertas visuales por color.
* **Módulos de Mantenimiento (CRUDs):** Gestión integral de Proveedores, Citas/Pedidos y Parámetros. Inclusión de validación de horarios operativos (07:00 - 17:00 L-S) y gestión dinámica de límites de tolerancia.
* **Motor de Clasificación Temporal:** Endpoint POST /api/llegadas que captura la hora del servidor y clasifica automáticamente el estado logístico (A TIEMPO, ANTICIPADO, TARDÍO, AUSENTE).
* **Soft Delete (Borrado Lógico):** Cumplimiento estricto de la política de cero borrado físico. Todas las operaciones de inactivación actualizan la bandera activo: false, filtrando las lecturas GET para mostrar únicamente registros vigentes.

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

* **Administrador:** admin@feen.ujmd.edu.sv
* **Coordinador:** coordinador@feen.ujmd.edu.sv *(Utilizar este rol para probar el registro de proveedores, parámetros y programación de citas)*
* **Operador:** operador@feen.ujmd.edu.sv *(Utilizar este rol para el control de caseta)*