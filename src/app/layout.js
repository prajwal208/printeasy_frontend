import Footer from "@/features/footer/Footer";
import "./globals.css";
import Navbar from "@/features/Main/Navbar/Navbar";
import { CartProvider } from "@/context/CartContext";
import WhatsAppFloat from "./WhatsAppFloat/WhatsAppFloat";

export const metadata = {
  title: "OnRise Store",
  description: "Onrise Store ecommerce dressing website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
       <link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Montserrat:wght@500;700&family=Raleway:wght@500&family=Rubik:wght@500;700&family=Nunito:wght@600&display=swap"
  rel="stylesheet"
  crossorigin="anonymous" 
/>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        ></meta>
        <meta property="og:title" />
        <meta property="og:image" />
        <meta property="og:description" />
        <meta property="og:url" />
      </head>
      <body>
        <CartProvider>
          <div className="navbar-wrapper">
            <Navbar />
          </div>
          {children}
          <Footer />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
