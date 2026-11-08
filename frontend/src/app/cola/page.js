'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar'; // Importa el Sidebar

export default function ColaEsperaPage() {
  const [cola, setCola] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Simular obtención de rol (ajusta según tu implementación)
  const rol = 'coordinador'; 
  const onLogout = () => console.log('Cerrar sesión');

  const fetchCola = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/cola');
      if (res.ok) {
        const data = await res.json();
        setCola(data);
      }
    } catch (error) {
      console.error('Error obteniendo la cola:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchCola();
    const intervalo = setInterval(fetchCola, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const obtenerEstiloBadge = (minutos) => {
    if (minutos >= 20) return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    if (minutos >= 10) return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
    return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Añadir el Sidebar al layout */}
      <Sidebar rol={rol} onLogout={onLogout} />
      
      {/* Contenedor principal para el contenido de la cola */}
      <div style={{ flexGrow: 1, padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>Cola de Prioridad Dinámica</h1>
              <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Gestión de vehículos en espera (Ordenamiento O(log n) + Regla de Aging)
              </p>
            </div>
            <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              Total en espera: {cola.length}
            </div>
          </div>

          {cargando ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando motor de prioridad...</p>
          ) : cola.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px dashed #d1d5db' }}>
              <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>No hay vehículos en la cola actualmente.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {cola.map((pedido, index) => {
                const esPrimero = index === 0;
                const coloresBadge = obtenerEstiloBadge(pedido.minutosEnEspera);

                return (
                  <div 
                    key={pedido._id} 
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      borderLeft: `5px solid ${esPrimero ? '#eab308' : '#3b82f6'}`,
                      transform: 'translateY(0)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>
                        {pedido.numeroPedido}
                      </h3>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        backgroundColor: coloresBadge.bg,
                        color: coloresBadge.text,
                        border: `1px solid ${coloresBadge.border}`
                      }}>
                        {pedido.minutosEnEspera} min esperando
                      </span>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.8' }}>
                      <p style={{ margin: '0' }}>
                        <strong style={{ color: '#374151' }}>Proveedor:</strong> {pedido.proveedorId?.razonSocial || 'Desconocido'}
                      </p>
                      <p style={{ margin: '0' }}>
                        <strong style={{ color: '#374151' }}>Carga:</strong>{' '}
                        <span style={{ textTransform: 'uppercase', backgroundColor: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                          {pedido.tipoProducto}
                        </span>
                      </p>
                      <p style={{ margin: '0' }}>
                        <strong style={{ color: '#374151' }}>Estado Inicial:</strong>{' '}
                        <span style={{ textTransform: 'uppercase', color: '#4f46e5', fontWeight: '500' }}>{pedido.estado}</span>
                      </p>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500' }}>Algoritmo Max-Heap</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Prioridad Actual</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2563eb', lineHeight: '1' }}>
                          {pedido.prioridadCalculada}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}