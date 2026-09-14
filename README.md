# Proyecto-Integrador---Sistema-de-Gesti-n-Log-stica-de-Recepci-n

# Documentación de los avances del programa

## Descripción

Este proyecto es un sistema de Gestión Logística de Recepción que implementa un modelo de arquitectura Cliente-Servidor. Incluye un módulo completo de autenticación y autorización segura basado en tokens JWT (JSON Web Tokens) con expiración de 24 horas, contraseñas encriptadas con bcrypt (asíncrono) y enrutamiento dinámico protegido en el cliente dependiendo del rol del usuario (Administrador, Coordinador u Operador).

## Herramientas

Backend (API REST):

Entorno: Node.js

Framework: Express.js

Base de Datos: MongoDB (local / Compass) con Mongoose ODM

Seguridad: bcrypt (hashing), jsonwebtoken (JWT), cors

Frontend (Cliente):

Framework: Next.js (App Router) / React

Estilos: Bootstrap 5

Dependencias extra: jwt-decode (para validación de payload en cliente)