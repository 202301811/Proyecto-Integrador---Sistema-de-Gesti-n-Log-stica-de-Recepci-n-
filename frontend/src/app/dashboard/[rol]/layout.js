"use client";
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children, params }) {
  const router = useRouter();
  const { rol } = use(params); 
  
  const [autenticado, setAutenticado] = useState(false);
  const [rolVerificado, setRolVerificado] = useState('');

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

      if (decoded.rol !== rol) {
        router.replace(`/dashboard/${decoded.rol}`);
        return;
      }

      setRolVerificado(decoded.rol);
      setAutenticado(true);
    } catch (e) {
      localStorage.removeItem('token');
      router.replace('/');
    }
  }, [router, rol]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (!autenticado) return null; 

  return (
    // Contenedor principal bloqueado exactamente al tamaño de la pantalla
    <div className="d-flex w-100" style={{ height: '100vh', backgroundColor: '#f4f6f9', overflow: 'hidden' }}>
      
      <Sidebar rol={rolVerificado} onLogout={handleLogout} />
      
      {/* El contenido principal toma el espacio restante y tiene su propio scroll */}
      <main className="flex-grow-1 p-4 overflow-auto pt-5 pt-md-4">
         {children}
      </main>
    </div>
  );
}