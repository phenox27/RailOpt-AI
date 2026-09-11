import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RailOpt AI — रेल अनुकूलन प्रणाली | Ministry of Railways, Government of India",
  description: "AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways — भारतीय रेल पर ट्रेन संचालन के लिए संपत्ति उपलब्धता को अधिकतम करने हेतु AI-संचालित स्वचालित ब्लॉक योजना",
  keywords: ["RailOpt AI", "Railway", "Block Planning", "Maintenance Optimization", "Indian Railways", "भारतीय रेल", "ब्लॉक योजना", "SIH26027", "Ministry of Railways", "Government of India"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
