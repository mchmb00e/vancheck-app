import 'bootstrap/dist/css/bootstrap.min.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es-CL">
      <body>
        {children}
      </body>
    </html>
  );
}