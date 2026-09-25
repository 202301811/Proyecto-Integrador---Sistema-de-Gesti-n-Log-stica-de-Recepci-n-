"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Truck, Calendar, Settings, Clock, LogOut } from 'lucide-react';

export default function Sidebar({ rol, onLogout }) {
  const [expandido, setExpandido] = useState(true);
  const [esMovil, setEsMovil] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checarAncho = () => {
      const isMobile = window.innerWidth < 992; 
      setEsMovil(isMobile);
      setExpandido(!isMobile);
    };
    
    checarAncho();
    window.addEventListener('resize', checarAncho);
    return () => window.removeEventListener('resize', checarAncho);
  }, []);

  useEffect(() => {
    if (esMovil) setExpandido(false);
  }, [pathname, esMovil]);

  const enlaces = [
    { href: `/dashboard/${rol}`, label: 'Inicio', icono: <Home size={20} />, roles: ['coordinador', 'operador'] },
    { href: `/dashboard/${rol}/proveedores`, label: 'Proveedores', icono: <Truck size={20} />, roles: ['coordinador'] },
    { href: `/dashboard/${rol}/pedidos`, label: 'Programar Citas', icono: <Calendar size={20} />, roles: ['coordinador'] },
    { href: `/dashboard/${rol}/parametros`, label: 'Parámetros', icono: <Settings size={20} />, roles: ['coordinador'] },
    { href: `/dashboard/${rol}/arribos`, label: 'Control Caseta', icono: <Clock size={20} />, roles: ['coordinador', 'operador'] },
  ];

  const enlacesPermitidos = enlaces.filter(enlace => enlace.roles.includes(rol));

  return (
    <>
      {esMovil && (
        <button 
          onClick={() => setExpandido(true)} 
          className="btn btn-dark position-fixed rounded shadow"
          style={{ top: '15px', left: '15px', zIndex: 1040, padding: '8px' }}
        >
          <Menu size={28} />
        </button>
      )}

      {esMovil && expandido && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark" 
          style={{ opacity: 0.6, zIndex: 1045 }}
          onClick={() => setExpandido(false)}
        ></div>
      )}

      {/* Contenedor Principal del Sidebar */}
      <div 
        className="bg-dark text-white d-flex flex-column shadow-lg flex-shrink-0" 
        style={{ 
          width: esMovil ? '260px' : (expandido ? '260px' : '80px'), 
          height: '100vh', 
          
          position: esMovil ? 'fixed' : 'sticky',
          top: 0,
          left: esMovil && !expandido ? '-260px' : '0',
          transition: 'width 0.3s ease, left 0.3s ease',
          zIndex: 1050,
          overflowX: 'hidden'
        }}
      >
        
        {/* Cabecera */}
        <div className={`d-flex align-items-center p-3 border-bottom border-secondary flex-shrink-0 w-100 ${expandido ? 'justify-content-between' : 'justify-content-center'}`}>
          {expandido && (
            <span className="fw-bold fs-5 text-truncate">Logística FEEN</span>
          )}
          <button onClick={() => setExpandido(!expandido)} className="btn btn-outline-light btn-sm border-0 p-1 flex-shrink-0">
            {esMovil ? <X size={24} /> : (expandido ? <X size={24} /> : <Menu size={24} />)}
          </button>
        </div>

        {/* Navegación */}
        <nav className="nav flex-column flex-grow-1 p-2 gap-2 mt-2 overflow-y-auto w-100">
          {enlacesPermitidos.map((enlace) => {
            const activo = pathname === enlace.href;
            return (
              <Link 
                key={enlace.href} 
                href={enlace.href}
                className={`nav-link d-flex align-items-center rounded text-white ${activo ? 'bg-primary shadow-sm' : ''} ${expandido ? 'px-3' : 'justify-content-center px-0'}`}
                style={{ transition: 'background-color 0.2s', padding: '12px 0' }}
                title={!expandido ? enlace.label : ''}
              >
                <div className="d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '24px' }}>
                  {enlace.icono}
                </div>
                {expandido && (
                  <span className="ms-3 text-nowrap">
                    {enlace.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer (Con pb-5 para alejarlo de la letra 'N' del entorno de desarrollo) */}
        <div className="p-3 pb-5 border-top border-secondary w-100 flex-shrink-0 bg-dark">
          <button 
            onClick={onLogout} 
            className={`btn btn-danger d-flex align-items-center ${expandido ? 'w-100 justify-content-start px-3' : 'justify-content-center p-2'}`} 
            title="Cerrar Sesión"
          >
            <div className="d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '24px' }}>
              <LogOut size={20} />
            </div>
            {expandido && (
              <span className="ms-3 text-nowrap">
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
        
      </div>
    </>
  );
}