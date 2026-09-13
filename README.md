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
```bash
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


---

### Paso 3: Prueba de los 3 Roles
Antes de hacer commit, haz una prueba rápida en el navegador para confirmar que los 3 roles creados por el script funcionan:
1. Entra con `coordinador@feen.ujmd.edu.sv` / `Password123!` -> debe llevar a `/dashboard/coordinador` y mostrar **COORDINADOR**.
2. Dale a Logout.
3. Entra con `operador@feen.ujmd.edu.sv` / `Password123!` -> debe llevar a `/dashboard/operador` y mostrar **OPERADOR**.
4. Dale a Logout.

---

### Paso 4: Enviar tu rama personal a GitHub
Abre la terminal en la raíz del proyecto y ejecuta estos comandos:

```bash
git status

(Verifica que solo aparezcan modificados o creados backend, frontend, .gitignore y README.md, y ninguna carpeta node_modules).

git add .
git commit -m "feat(auth): implementacion completa de login JWT, RBAC y logout fullstack"
git push -u origin feature-rene-auth