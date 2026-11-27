require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestion_proveedores';

async function poblarDatos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB...');

    // Limpiar colecciones
    try { await mongoose.connection.collection('roles').drop(); } catch (e) {}
    try { await mongoose.connection.collection('usuarios').drop(); } catch (e) {}

    // 1. Extraer los permisos válidos directamente del Schema de Mongoose
    let permisosValidos = [];
    try {
      const enumSchema = Role.schema.path('permisos.0') || Role.schema.path('permisos');
      if (enumSchema && enumSchema.enumValues) {
        permisosValidos = enumSchema.enumValues;
      }
    } catch (err) {
      permisosValidos = [];
    }

    console.log('Permisos permitidos por el modelo:', permisosValidos);

    // Si encontró el enum del modelo, los usa todos para admin; si no, deja arreglo vacío
    const permisosAdmin = permisosValidos.length > 0 ? permisosValidos : [];
    const permisosCoord = permisosValidos.filter(p => !p.includes('usuario'));
const permisosOper = permisosValidos.filter(p => 
  p.includes('descarga') || 
  p.includes('arribo') || 
  p.includes('pedido') || 
  p.includes('gateway') ||
  p.includes('cola')
);

    // 2. Crear los roles con valores válidos
    const rolAdmin = await Role.create({
      nombreRol: 'administrador',
      descripcion: 'Acceso total y administración del sistema',
      activo: true,
      permisos: permisosAdmin
    });

    const rolCoord = await Role.create({
      nombreRol: 'coordinador',
      descripcion: 'Supervisión de compras, citas y logística',
      activo: true,
      permisos: permisosCoord
    });

    const rolOper = await Role.create({
      nombreRol: 'operador',
      descripcion: 'Operador de garita, caseta y descarga',
      activo: true,
      permisos: permisosOper
    });

    // 3. Crear usuarios de prueba
    await User.create({
      nombres: 'René',
      apellidosCompleto: 'Palacios',
      email: 'admin@feen.ujmd.edu.sv',
      password: 'Password123!',
      roles: [rolAdmin._id],
      activo: true,
      mfaObligatorio: false
    });

    await User.create({
      nombres: 'Coordinador',
      apellidosCompleto: 'Logístico',
      email: 'coordinador@feen.ujmd.edu.sv',
      password: 'Password123!',
      roles: [rolCoord._id],
      activo: true,
      mfaObligatorio: false
    });

    await User.create({
      nombres: 'Operador',
      apellidosCompleto: 'Caseta',
      email: 'operador@feen.ujmd.edu.sv',
      password: 'Password123!',
      roles: [rolOper._id],
      activo: true,
      mfaObligatorio: true
    });

    console.log('✅ Base de datos poblada exitosamente respetando los enums del modelo.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al poblar:', error);
    process.exit(1);
  }
}

poblarDatos();