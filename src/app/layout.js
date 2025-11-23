import Footer from "@/features/footer/Footer";
import "./globals.css";
import Navbar from "@/features/Main/Navbar/Navbar";

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
        />
        <link src="https://checkout.razorpay.com/v1/checkout.js"></link>
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
