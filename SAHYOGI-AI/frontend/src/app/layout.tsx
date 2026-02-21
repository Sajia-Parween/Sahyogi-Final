import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { FarmerProvider } from "../context/FarmerContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FarmerProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </FarmerProvider>
      </body>
    </html>
  );
}