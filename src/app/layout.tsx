import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Generador de Libros Perfectos',
  description: 'Sistema de generación narrativa con IA de nivel editorial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
