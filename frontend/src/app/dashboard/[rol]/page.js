"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function DashboardRolPage() {
  const router = useRouter();
  const params = useParams();
  const [cargando, setCargando] = useState(true);

  // Obtenemos el rol desde los parámetros de la URL
  const rolParam = params?.rol || '';

  useEffect(() => {
    const verificarSesion = () => {
      const token = localStorage.getItem('token');

      // Si no hay token, redirigir al login
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const ahora = Date.now() / 1000;

        // Validar expiración o discrepancia de rol
        if (decoded.exp < ahora || decoded.rol !== rolParam) {
          localStorage.removeItem('token');
          router.replace('/');
          return;
        }

        // Si el token es válido y coincide el rol, finaliza la carga
        setCargando(false);
      } catch (err) {
        localStorage.removeItem('token');
        router.replace('/');
      }
    };

    verificarSesion();
  }, [router, rolParam]);

  // Cierre de sesión (Logout) requerido por la rúbrica
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (cargando) {
    return null; // Vista vacía mientras valida la sesión
  }

  return (
    <div className="container py-4">
      {/* Botón de Logout */}
      <div className="d-flex justify-content-end mb-4">
        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
          Cerrar Sesión (Logout)
        </button>
      </div>

      {/* Requisito: Página vacía que únicamente presenta el nombre del rol */}
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <h1 className="display-4 fw-bold text-uppercase text-secondary">
          {rolParam}
        </h1>
      </div>
    </div>
  );
}