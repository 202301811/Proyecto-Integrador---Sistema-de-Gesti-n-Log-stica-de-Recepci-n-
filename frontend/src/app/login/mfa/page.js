"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react'; 
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function MfaPage() {
  const router = useRouter();
  const [estado, setEstado] = useState('cargando'); // 'setup' o 'verify'
  const [qrUri, setQrUri] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Leemos el token temporal que guardaremos desde el login principal
    const tempToken = localStorage.getItem('tempToken');
    const mfaStatus = localStorage.getItem('mfaStatus'); 

    if (!tempToken) {
      router.push('/login');
      return;
    }

    if (mfaStatus === 'setup') {
      setEstado('setup');
      generarQr(tempToken);
    } else {
      setEstado('verify');
    }
  }, [router]);

  const generarQr = async (token) => {
    try {
      const res = await fetch('http://localhost:4000/api/mfa/setup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQrUri(data.qrUri);
      } else {
        setError(data.mensaje);
      }
    } catch (error) {
      setError('Error al conectar con el servidor.');
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setError('');
    const tempToken = localStorage.getItem('tempToken');

    try {
      // 1. Si es la primera vez, habilitamos el MFA enviando el código
      if (estado === 'setup') {
        const resEnable = await fetch('http://localhost:4000/api/mfa/enable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`
          },
          body: JSON.stringify({ token: codigo })
        });
        const dataEnable = await resEnable.json();
        if (!resEnable.ok) throw new Error(dataEnable.mensaje);
      }

      // 2. Verificamos el login para obtener el JWT definitivo de 8 horas
      const resVerify = await fetch('http://localhost:4000/api/auth/mfa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ token: codigo })
      });
      const dataVerify = await resVerify.json();

      if (!resVerify.ok) throw new Error(dataVerify.mensaje);

      // 3. Login exitoso: Limpiamos temporales, guardamos JWT final y redirigimos
      localStorage.setItem('token', dataVerify.token);
      localStorage.setItem('usuario', JSON.stringify(dataVerify.usuario));
      localStorage.removeItem('tempToken');
      localStorage.removeItem('mfaStatus');

      router.push(`/dashboard/${dataVerify.rol.toLowerCase()}`);
    } catch (err) {
      setError(err.message || 'Código incorrecto o expirado.');
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
      <div className="card shadow-lg border-0 rounded-4 p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <ShieldCheck size={50} className="text-primary mb-2" />
          <h4 className="fw-bold">Autenticación en 2 Pasos</h4>
          <p className="text-muted small">
            {estado === 'setup' ? 'Configura Google Authenticator para continuar' : 'Ingresa el código de 6 dígitos de tu aplicación'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
            <AlertCircle size={18} className="me-2" /> <small>{error}</small>
          </div>
        )}

        {estado === 'setup' && qrUri && (
          <div className="text-center mb-4 bg-white p-3 border rounded-3">
            <QRCodeCanvas value={qrUri} size={200} />
            <p className="small text-muted mt-3 mb-0">Escanea este código con <strong>Google Authenticator</strong></p>
          </div>
        )}

        <form onSubmit={verificarCodigo}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-lg text-center fw-bold text-primary"
              placeholder="000000"
              maxLength="6"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ''))}
              required
              style={{ letterSpacing: '0.5rem', fontSize: '1.5rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 btn-lg fw-bold">
            Verificar y Entrar
          </button>
        </form>
      </div>
    </div>
  );
}