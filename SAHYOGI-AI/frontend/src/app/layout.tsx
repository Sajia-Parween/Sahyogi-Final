import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { FarmerProvider } from "../context/FarmerContext";
import { BuyerProvider } from "../context/BuyerContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FarmerProvider>
          <BuyerProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </BuyerProvider>
        </FarmerProvider>
      </body>
    </html>
  );
}