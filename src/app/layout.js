import { Poppins, Montserrat, Raleway, Rubik, Nunito } from "next/font/google";
import Script from "next/script";
import Footer from "@/features/footer/Footer";
import Navbar from "@/features/Main/Navbar/Navbar";
import { CartProvider } from "@/context/CartContext";
import WhatsAppFloat from "./WhatsAppFloat/WhatsAppFloat";
import "./globals.css";

// 1. Optimize Fonts using next/font
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-poppins" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-montserrat" });

export const metadata = {
  title: "OnRise Store",
  description: "Onrise Store ecommerce dressing website",
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  openGraph: {
    title: "OnRise Store",
    description: "Onrise Store ecommerce dressing website",
    url: "https://yourwebsite.com",
    siteName: "OnRise Store",
    images: [
      {
        url: "/og-image.jpg", // Path to your public folder image
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable}`}>
      <body>
        {/* 2. Meta Pixel using next/script for better loading performance */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1017728720565282');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2033584677058053&ev=PageView&noscript=1"
          />
        </noscript>

        <CartProvider>
          <div className="navbar-wrapper">
            <Navbar />
          </div>
          <main>{children}</main>
          <Footer />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}