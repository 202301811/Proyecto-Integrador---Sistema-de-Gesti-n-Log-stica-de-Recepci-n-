require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestion_proveedores';

async function poblarDatos() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado para poblar...');

  // Limpiar antes de crear
  await Role.deleteMany({});
  await User.deleteMany({});

  // 1. Crear roles
  const rolAdmin = await Role.create({
    nombre: 'administrador',
    descripcion: 'Acceso total y configuración de red',
  });
  const rolCoord = await Role.create({
    nombre: 'coordinador',
    descripcion: 'Supervisión de compras y proveedores',
  });
  const rolOper = await Role.create({
    nombre: 'operador',
    descripcion: 'Recepción y captura de datos operativos',
  });

  // 2. Crear usuarios con contraseña: Password123!
  await User.create({
    nombres: 'René',
    apellidosCompleto: 'Palacios',
    email: 'admin@feen.ujmd.edu.sv',
    password: 'Password123!',
    roles: [rolAdmin._id],
    estado: 'activo',
  });

  await User.create({
    nombres: 'Coordinador',
    apellidosCompleto: 'General',
    email: 'coordinador@feen.ujmd.edu.sv',
    password: 'Password123!',
    roles: [rolCoord._id],
    estado: 'activo',
  });

  await User.create({
    nombres: 'Operador',
    apellidosCompleto: 'Turno A',
    email: 'operador@feen.ujmd.edu.sv',
    password: 'Password123!',
    roles: [rolOper._id],
    estado: 'activo',
  });

  console.log('✅ Base de datos poblada con éxito. Contraseña para todos: Password123!');
  mongoose.connection.close();
}

poblarDatos().catch(console.error);