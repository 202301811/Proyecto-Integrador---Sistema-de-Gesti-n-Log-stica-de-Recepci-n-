"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function LoginPage() {
  const router = useRouter();
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setCredenciales({
      ...credenciales,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene la recarga del formulario para manejar el estado en React
    setError(null);
    setCargando(true);

    try {
      // Petición asíncrona al backend para validar credenciales y obtener el JWT
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      // 1. Persistencia: Guardar el token firmado de forma segura en el navegador
      localStorage.setItem('token', data.token);

      // 2. Control de Accesos (RBAC): Desencriptar el payload en el cliente
      // Extraemos la información de identidad no sensible (id, correo, nombres, rol)
      const tokenDecodificado = jwtDecode(data.token);
      const rolUsuario = tokenDecodificado.rol; 

      // 3. Enrutamiento dinámico de Next.js hacia el panel correspondiente al rol
      router.push(`/dashboard/${rolUsuario}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      {/* Mejora UI: Sombras más amplias (shadow-lg), más padding (p-5) y bordes redondeados (rounded-4) */}
      <div className="card shadow-lg p-5 col-12 col-md-6 col-lg-4 border-0 rounded-4">
        <h3 className="text-center mb-3 text-primary fw-bold">Gestor de Proveedores</h3>
        <p className="text-center text-muted small mb-4">Ingrese sus credenciales institucionales</p>

        {error && (
          <div className="alert alert-danger py-2 rounded-3 shadow-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              className="form-control form-control-lg bg-light"
              value={credenciales.email}
              onChange={handleChange}
              placeholder="ejemplo@feen.ujmd.edu.sv"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary">Contraseña</label>
            <input
              type="password"
              name="password"
              className="form-control form-control-lg bg-light"
              value={credenciales.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Mejora UI: Botón más grande (btn-lg), con sombra y transición */}
          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
            disabled={cargando}
          >
            {cargando ? 'Validando Accesos...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}