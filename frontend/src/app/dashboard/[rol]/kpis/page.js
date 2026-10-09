"use client";
import { useState, useEffect, use } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Clock, AlertTriangle, Activity } from 'lucide-react';

export default function DashboardKpisPage({ params }) {
  const { rol } = use(params);
  const [dataKpi, setDataKpi] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Colores para los gráficos
  const COLORES_PIE = {
    'A TIEMPO': '#198754',      // Success
    'ANTICIPADO': '#0dcaf0',    // Info
    'TARDÍO': '#ffc107',        // Warning
    'AUSENTE': '#dc3545'        // Danger
  };
  const COLOR_PRIMARIO = '#0d6efd';
  const COLOR_SECUNDARIO = '#6c757d';

  useEffect(() => {
    // RN: Acceso exclusivo para Coordinador y Administrador
    if (rol !== 'operador') {
      cargarKPIs();
    } else {
      setCargando(false);
    }
  }, [rol]);

  const cargarKPIs = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/kpis', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.mensaje || 'Error al obtener indicadores');
      
      // Formatear datos para Recharts
      const dataFormateada = {
        espera: data.tiempoEsperaPromedio,
        descarga: data.descargaPorTipo.map(d => ({ nombre: d._id.toUpperCase(), minutos: Math.round(d.promedioDescarga) })),
        cumplimiento: data.cumplimiento.map(c => ({ nombre: c._id, valor: c.cantidad })),
        ocupacion: data.ocupacionGateways.map(o => ({ gateway: `GW ${o._id}`, minutos: o.totalMinutos })),
        volumen: data.volumenDiario.reverse().map(v => ({ fecha: v._id, pedidos: v.totalPedidos }))
      };
      
      setDataKpi(dataFormateada);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Bloqueo de seguridad para el rol Operador
  if (rol === 'operador') {
    return (
      <div className="container-fluid py-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <AlertTriangle size={80} className="text-warning mb-4" />
        <h2 className="fw-bold text-dark">Acceso Restringido</h2>
        <p className="text-muted fs-5">El Dashboard Analítico de KPIs es exclusivo para Coordinadores Logísticos y Administradores.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h2 className="fw-bold d-flex align-items-center text-dark">
          <BarChart3 className="me-3 text-primary" size={32} /> 
          Dashboard Analítico Logístico
        </h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {cargando || !dataKpi ? (
        <div className="text-center text-muted py-5">Calculando indicadores en tiempo real...</div>
      ) : (
        <div className="row g-4">
          
          {/* Tarjeta Superior: Promedio de Espera */}
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-primary text-white">
              <div className="card-body p-4 d-flex flex-column justify-content-center align-items-center text-center">
                <Clock size={48} className="mb-3 opacity-75" />
                <h6 className="fw-bold text-uppercase opacity-75 mb-1">Tiempo Promedio de Espera</h6>
                <h1 className="display-4 fw-bold mb-0">{dataKpi.espera} <span className="fs-4">min</span></h1>
                <small className="mt-2 opacity-75">Desde caseta hasta inicio en muelle</small>
              </div>
            </div>
          </div>

          {/* Gráfico 1: Tiempo Promedio de Descarga por Tipo */}
          <div className="col-12 col-md-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Promedio de Descarga por Categoría</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataKpi.descarga} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre" type="category" width={100} fontWeight="bold" />
                    <Tooltip cursor={{fill: '#f8f9fa'}} formatter={(value) => [`${value} minutos`, 'Promedio']} />
                    <Bar dataKey="minutos" fill={COLOR_PRIMARIO} radius={[0, 4, 4, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráfico 2: Nivel de Cumplimiento (Pastel) */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4 text-center">
                <h5 className="fw-bold mb-4">Nivel de Cumplimiento de Arribos</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={dataKpi.cumplimiento} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="valor">
                      {dataKpi.cumplimiento.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES_PIE[entry.nombre] || COLOR_SECUNDARIO} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} camiones`, 'Cantidad']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráfico 3: Tasa de Ocupación por Gateway */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Tasa de Ocupación por Muelle (Minutos Totales)</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataKpi.ocupacion} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="gateway" fontWeight="bold" />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f8f9fa'}} formatter={(value) => [`${value} min`, 'Operación']} />
                    <Bar dataKey="minutos" fill="#0dcaf0" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráfico 4: Volumen Diario */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Volumen Diario de Recepción (Últimos 7 días)</h5>
                  <Activity className="text-secondary" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dataKpi.volumen} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="fecha" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} pedidos finalizados`, 'Volumen']} />
                    <Line type="monotone" dataKey="pedidos" stroke={COLOR_PRIMARIO} strokeWidth={3} dot={{ r: 6, fill: COLOR_PRIMARIO }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}