# Sistema de Gestión Logística de Recepción - Gestor de Proveedores MVP

Proyecto Integrador interdisciplinar desarrollado para la Facultad de Economía, Empresa y Negocios FEEN.

## Sprint 0: Módulo de Autenticación y Control de Acceso (RBAC)

### Arquitectura Técnica
- **Frontend:** Next.js (App Router) estilizado con clases nativas de Bootstrap.
- **Backend:** API REST en Express.js sobre Node.js.
- **Base de Datos:** MongoDB local gestionada mediante Mongoose.
- **Seguridad:** Hash asíncrono de contraseñas con bcrypt y generación de tokens de sesión con JSON Web Token (JWT).

### Especificaciones del Flujo de Autenticación
1. **Formulario Reactivo y Controlado:** Captura de credenciales institucionales mediante estados en React.
2. **Endpoint de Ingreso:** `POST /api/auth/login` valida usuario, estado activo y contraseña. Retorna un JWT con tiempo de expiración de 24 horas y payload no sensible (id, correo, nombres y rol).
3. **Persistencia en Cliente:** El token se almacena en el `localStorage` del navegador.
4. **Validación de Roles y Redirección Dinámica:** El payload del JWT se decodifica en el cliente con `jwt-decode`, redirigiendo dinámicamente a la ruta correspondiente:
   - `/dashboard/administrador`
   - `/dashboard/coordinador`
   - `/dashboard/operador`
5. **Vista Post-Login:** Página inicial que presenta únicamente el rol autenticado validado contra el token.
6. **Cierre de Sesión Seguro (Logout):** Remueve el JWT de `localStorage` y redirige al inicio bloqueando la navegación hacia atrás en el historial.

### Instrucciones de Ejecución Local

#### 1. Base de datos
Asegurarse de tener el servicio local de MongoDB iniciado en el puerto 27017.

#### 2. Servidor Backend

cd backend
npm install
node semilla.js   # Ejecutar una sola vez para poblar roles y usuarios
node index.js

El servidor backend escuchará en http://localhost:4000.
3. Cliente Frontend

cd frontend
npm install
npm run dev

El aplicativo frontend estará disponible en http://localhost:3000.
Credenciales de Prueba (Contraseña general: Password123!)

    Administrador: admin@feen.ujmd.edu.sv
    Coordinador: coordinador@feen.ujmd.edu.sv
    Operador: operador@feen.ujmd.edu.sv


