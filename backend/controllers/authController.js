const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña requeridos' });
    }

    // Buscar usuario, poblar roles y pedir los campos ocultos necesarios para el MFA (+password y +twoFactorSecret)
    const usuario = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +twoFactorSecret')
      .populate('roles');
      
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'Usuario inactivo en el sistema' });
    }

    // Usamos tu método existente para comparar la contraseña
    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // Obtener el nombre del rol asignado
    const rolNombre = usuario.roles && usuario.roles.length > 0 
      ? usuario.roles[0].nombre 
      : 'operador';

    // REGLAS DE GOBERNANZA MFA (Sprint 5)
    const requiereMfa = usuario.mfaObligatorio || usuario.twoFactorEnabled;

    if (requiereMfa) {
        // Emisión de TempToken (Expira en 5 min, tipo MFA_TEMP)
        const tempToken = jwt.sign(
            { id: usuario._id, email: usuario.email, type: 'MFA_TEMP' },
            process.env.JWT_SECRET || 'super_secreto_para_firma_jwt_2026_feen',
            { expiresIn: '5m' }
        );

        // Si es obligatorio pero aún no lo ha configurado, lo mandamos a enrolarse
        if (usuario.mfaObligatorio && !usuario.twoFactorEnabled) {
            return res.status(200).json({
                mensaje: 'Configuración MFA obligatoria requerida.',
                mfaSetupRequired: true,
                tempToken
            });
        }

        // Si ya lo tiene activo, pedir el código TOTP de 6 dígitos
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