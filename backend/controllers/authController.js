const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña requeridos' });
    }

    // Buscar usuario, poblar roles y pedir los campos ocultos necesarios para el MFA
    const usuario = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +twoFactorSecret')
      .populate('roles');
      
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // SPRINT 7: Cambio de estado (String) a activo (Boolean) para el Soft Delete
    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'Usuario inactivo en el sistema' });
    }

    // Usamos tu método existente para comparar la contraseña
    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // SPRINT 7: Extraer el nombre del rol y la lista unificada de permisos
    let permisosSet = new Set();
    let rolNombre = 'operador';

    if (usuario.roles && usuario.roles.length > 0) {
      // Extraemos la primera palabra en minúsculas (Ej: "Supervisor de Turno" -> "supervisor")
      const rolOriginal = usuario.roles[0].nombreRol || usuario.roles[0].nombre || 'operador';
      rolNombre = rolOriginal.split(' ')[0].toLowerCase();
      
      // Extraemos los permisos de cada rol que esté activo
      usuario.roles.forEach(rol => {
        if (rol && rol.activo && rol.permisos) {
          rol.permisos.forEach(p => permisosSet.add(p));
        }
      });
    }
    const permisos = Array.from(permisosSet);

    // REGLAS DE GOBERNANZA MFA (Sprint 5)
    const requiereMfa = usuario.mfaObligatorio || usuario.twoFactorEnabled;

    if (requiereMfa) {
        // Emisión de TempToken (Expira en 5 min, tipo MFA_TEMP)
        const tempToken = jwt.sign(
            { id: usuario._id, email: usuario.email, type: 'MFA_TEMP' },
            process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen',
            { expiresIn: '5m' }
        );

        if (usuario.mfaObligatorio && !usuario.twoFactorEnabled) {
            return res.status(200).json({
                mensaje: 'Configuración MFA obligatoria requerida.',
                mfaSetupRequired: true,
                tempToken
            });
        }

        return res.status(200).json({
            mensaje: 'Autenticación en dos pasos requerida.',
            mfaVerificationRequired: true,
            tempToken
        });
    }

    // FLUJO NORMAL (Si no requiere MFA, entregamos JWT definitivo)
    const payload = {
      id: usuario._id,
      email: usuario.email,
      nombres: usuario.nombres,
      rol: rolNombre,
      permisos: permisos // <-- SPRINT 7: Inyectamos el arreglo de permisos
    };

    // La rúbrica pide que el token definitivo dure 8h
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen', {
      expiresIn: '8h',
    });

    return res.status(200).json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: payload,
    });
  } catch (error) {
    console.error('Error en /login:', error);
    return res.status(500).json({ mensaje: 'Error interno en el servidor' });
  }
};

// ==========================================
// SEGUNDA ETAPA: VERIFICAR CÓDIGO MFA (TOTP)
// ==========================================
exports.verificarMFA = async (req, res) => {
  const { tempToken, tokenMFA } = req.body;

  try {
    if (!tempToken || !tokenMFA) {
      return res.status(400).json({ mensaje: 'Faltan datos de verificación (token o código).' });
    }

    // 1. Decodificar el Token Temporal emitido en el login
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen');
    
    // 2. Buscar al usuario y traer su secreto (twoFactorSecret)
    const usuario = await User.findById(decoded.id).select('+twoFactorSecret').populate('roles');
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // 3. Verificar el código de 6 dígitos usando speakeasy
    const speakeasy = require('speakeasy');
    const esValido = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token: tokenMFA,
      window: 1 // Da 30 segundos de tolerancia por si el usuario tarda en escribirlo
    });

    if (!esValido) {
      return res.status(401).json({ mensaje: 'Código incorrecto o expirado.' });
    }

    // 4. Si el código es correcto, generamos el JWT definitivo
    let permisosSet = new Set();
    let rolNombre = 'operador';

    if (usuario.roles && usuario.roles.length > 0) {
      // Formateamos el rol también aquí por seguridad
      const rolOriginal = usuario.roles[0].nombreRol || usuario.roles[0].nombre || 'operador';
      rolNombre = rolOriginal.split(' ')[0].toLowerCase();
      
      usuario.roles.forEach(rol => {
        if (rol && rol.activo && rol.permisos) {
          rol.permisos.forEach(p => permisosSet.add(p));
        }
      });
    }

    const payload = {
      id: usuario._id,
      email: usuario.email,
      nombres: usuario.nombres,
      rol: rolNombre,
      permisos: Array.from(permisosSet)
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen', {
      expiresIn: '8h',
    });

    return res.status(200).json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: payload,
    });

  } catch (error) {
    console.error('Error en verificarMFA:', error);
    return res.status(401).json({ mensaje: 'Token temporal expirado o inválido. Vuelve a iniciar sesión.' });
  }
};