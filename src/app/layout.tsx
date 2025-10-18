import "./globals.css";

import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bonkilingua",
  description: "Language learning app with AI-powered corrections",
  openGraph: {
    title: "Bonkilingua",
    description: "Language learning app with AI-powered corrections",
    url: "https://bonkilingua.com",
    siteName: "Bonkilingua",
    images: [
      {
        url: "https://i.imgur.com/SDC1CcF.png",
        width: 1200,
        height: 630,
        alt: "Bonkilingua - Language Learning App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bonkilingua",
    description: "Language learning app with AI-powered corrections",
    images: ["https://i.imgur.com/SDC1CcF.png"],
  },
  metadataBase: new URL("https://bonkilingua.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthProvider>
          <div className='flex justify-center min-h-screen bg-gray-50'>
            <div className='w-full max-w-md bg-white shadow-sm min-h-screen flex flex-col'>{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
