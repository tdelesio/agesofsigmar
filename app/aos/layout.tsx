import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode, Suspense } from "react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Warhammer AoS: Age of Sigmar Helper",
  description: "A Warhammer AoS tool to help you keep track of your abilities and tactics.  ",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      
      <body className={inter.className}>
      <Suspense fallback={null}>
        {children}
      </Suspense>

      </body>
    </html>
  );
}
