import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Gestor de Proveedores - Autenticación',
  description: 'Sistema de Gestión Logística de Recepción',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-light min-vh-100">
        {children}
      </body>
    </html>
  );
}