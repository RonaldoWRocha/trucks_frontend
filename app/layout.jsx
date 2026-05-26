import "../styles.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Norte - Gestao de Frota Inteligente",
  description: "Painel de telemetria e gestao de frota da Norte.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="light" data-density="comfortable">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
