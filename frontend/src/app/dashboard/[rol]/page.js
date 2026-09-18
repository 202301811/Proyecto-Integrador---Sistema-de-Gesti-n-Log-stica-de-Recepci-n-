"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link'; // Importación necesaria para la navegación en Next.js

export default function DashboardRolPage() {
  const router = useRouter();
  const params = useParams();
  const [rolVerificado, setRolVerificado] = useState('');
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const ahora = Date.now() / 1000;
      if (decoded.exp < ahora) {
        localStorage.removeItem('token');
        router.replace('/');
        return;
      }

      setRolVerificado(decoded.rol);
      setAutenticado(true);
    } catch (e) {
      localStorage.removeItem('token');
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (!autenticado) {
    return null; 
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-end mb-4">
        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
          Cerrar Sesión (Logout)
        </button>
      </div>
      
      <div className="d-flex flex-column justify-content-center align-items-center mt-5">
        <h1 className="display-4 fw-bold text-uppercase text-secondary mb-5">
          Panel de {rolVerificado}
        </h1>

        {/* Menú exclusivo para el Coordinador Logístico */}
        {rolVerificado === 'coordinador' && (
          <div className="d-flex gap-4">
            <Link href="/dashboard/coordinador/proveedores" className="btn btn-primary btn-lg px-4 shadow-sm">
              🚛 Registrar Proveedor
            </Link>
            <Link href="/dashboard/coordinador/pedidos" className="btn btn-success btn-lg px-4 shadow-sm">
              📅 Programar Pedido (Cita)
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}