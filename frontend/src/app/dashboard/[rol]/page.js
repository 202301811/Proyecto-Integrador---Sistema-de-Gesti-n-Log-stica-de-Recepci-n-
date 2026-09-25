"use client";
import { use } from 'react';

export default function DashboardWelcomePage({ params }) {
  // Desenvolvemos el parámetro dinámico de Next.js 15+
  const { rol } = use(params);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100" style={{ minHeight: '80vh' }}>
      <div className="text-center px-3">
        <h1 className="display-4 fw-bold text-dark mb-4 text-capitalize">
          Bienvenido al Panel de {rol}
        </h1>
        <p className="lead text-secondary mx-auto" style={{ maxWidth: '600px' }}>
          Sistema de Gestión Logística conectado y asegurado. 
          Selecciona un módulo en el menú lateral para comenzar a operar.
        </p>
      </div>
    </div>
  );
}