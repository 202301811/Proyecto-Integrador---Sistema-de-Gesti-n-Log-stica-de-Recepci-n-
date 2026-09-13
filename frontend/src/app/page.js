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
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      // 1. Guardar el token de forma segura en localStorage
      localStorage.setItem('token', data.token);

      // 2. Desencriptar el payload del token en el cliente para obtener el rol
      const tokenDecodificado = jwtDecode(data.token);
      const rolUsuario = tokenDecodificado.rol; // 'administrador', 'coordinador' u 'operador'

      // 3. Redirección dinámica según el rol
      router.push(`/dashboard/${rolUsuario}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow-sm p-4 col-12 col-md-6 col-lg-4 border-0">
        <h3 className="text-center mb-3 text-primary fw-bold">Gestor de Proveedores</h3>
        <p className="text-center text-muted small mb-4">Ingrese sus credenciales institucionales</p>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={credenciales.email}
              onChange={handleChange}
              placeholder="ejemplo@feen.ujmd.edu.sv"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Contraseña</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={credenciales.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={cargando}
          >
            {cargando ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}