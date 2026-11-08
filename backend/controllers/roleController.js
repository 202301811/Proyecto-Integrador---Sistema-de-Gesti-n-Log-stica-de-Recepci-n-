const Role = require('../models/Role');
const Usuario = require('../models/User'); 
const Evento = require('../models/Evento');   

// 1. Obtener todos los roles activos
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ activo: true });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener los roles', error: error.message });
  }
};

// 2. Crear un nuevo rol 
exports.createRole = async (req, res) => {
  try {
    const nombreRol = req.body.nombreRol || req.body.nombre;
    const { descripcion, permisos } = req.body;
    // Soporta .id o ._id por si el token viene diferente
    const usuarioId = req.usuario ? (req.usuario.id || req.usuario._id) : null;

    if (!nombreRol) {
      return res.status(400).json({ msg: 'El nombre del rol es obligatorio.' });
    }

    const rolExistente = await Role.findOne({ nombreRol });
    if (rolExistente) {
      return res.status(400).json({ msg: 'Ya existe un rol con este nombre.' });
    }

    // APLICAR MINÚSCULAS: Evita que "Gateways" rompa el enum "gateways" de la base de datos
    let permisosFormateados = [];
    if (permisos && Array.isArray(permisos)) {
        permisosFormateados = permisos.map(p => p.toLowerCase());
    }

    const nuevoRol = new Role({
      nombreRol,
      descripcion: descripcion || '',
      permisos: permisosFormateados,
      activo: true,
      usuarioCreacion: usuarioId
    });

    await nuevoRol.save();

    // Auditoría aislada: Si esto falla, no arruina la creación del rol
    if (usuarioId) {
        try {
            await Evento.create({
              usuarioId: usuarioId,       // <-- AGREGADO (Exigido por el modelo)
              usuarioCreacion: usuarioId, // <-- Exigido por el modelo
              accion: 'ROL_CREADO',
              detalles: `Se creó el rol: ${nuevoRol.nombreRol}`,
              fechaHora: new Date()
            });
        } catch (auditError) {
            console.error('Error silencioso en auditoría (Ignorado):', auditError.message);
        }
    }

    res.status(201).json({ msg: 'Rol creado exitosamente', rol: nuevoRol });
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({ msg: 'Error al crear el rol', error: error.message });
  }
};

// 3. Actualizar un rol existente (BLINDADO)
exports.updateRole = async (req, res) => {
  try {
    const nombreRol = req.body.nombreRol || req.body.nombre;
    const { descripcion, permisos } = req.body;
    const usuarioId = req.usuario ? (req.usuario.id || req.usuario._id) : null;

    let rol = await Role.findById(req.params.id);
    if (!rol || !rol.activo) {
      return res.status(404).json({ msg: 'Rol no encontrado' });
    }

    // APLICAR MINÚSCULAS
    let permisosFormateados = rol.permisos;
    if (permisos && Array.isArray(permisos)) {
        permisosFormateados = permisos.map(p => p.toLowerCase());
    }

    rol.nombreRol = nombreRol || rol.nombreRol;
    rol.descripcion = descripcion || rol.descripcion;
    rol.permisos = permisosFormateados;
    rol.usuarioActualizacion = usuarioId;

    await rol.save();

    // Auditoría aislada
    if (usuarioId) {
        try {
            await Evento.create({
              usuarioId: usuarioId,       // <-- AGREGADO
              usuarioCreacion: usuarioId, 
              accion: 'ROL_MODIFICADO',
              detalles: `Se modificó el rol: ${rol.nombreRol}`,
              fechaHora: new Date()
            });
        } catch (auditError) {
            console.error('Error silencioso en auditoría (Ignorado):', auditError.message);
        }
    }

    res.json(rol);
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    res.status(500).json({ msg: 'Error al actualizar el rol', error: error.message });
  }
};

// 4. Desactivar un rol (BLINDADO)
exports.deleteRole = async (req, res) => {
  try {
    const usuarioId = req.usuario ? (req.usuario.id || req.usuario._id) : null;
    const rolId = req.params.id;

    const usuariosConRol = await Usuario.findOne({ roles: rolId, activo: true });
    if (usuariosConRol) {
      return res.status(403).json({ 
        msg: 'Operación rechazada: No se puede desactivar el rol porque existen usuarios activos que lo tienen asignado.' 
      });
    }

    let rol = await Role.findById(rolId);
    if (!rol || !rol.activo) {
      return res.status(404).json({ msg: 'Rol no encontrado' });
    }

    rol.activo = false;
    rol.usuarioActualizacion = usuarioId;
    await rol.save();

    if (usuarioId) {
        try {
            await Evento.create({
              usuarioId: usuarioId,       // <-- AGREGADO
              usuarioCreacion: usuarioId, 
              accion: 'ROL_DESACTIVADO',
              detalles: `Se desactivó el rol: ${rol.nombreRol}`,
              fechaHora: new Date()
            });
        } catch (auditError) {
            console.error('Error silencioso en auditoría (Ignorado):', auditError.message);
        }
    }

    res.json({ msg: 'Rol desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al desactivar el rol', error: error.message });
  }
};