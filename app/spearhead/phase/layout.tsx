import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ReactNode, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Warhammer AoS: Spearhead Helper",
  description: "A Warhammer AoS Spearhead tool to help you keep track of your abilities and tactics.  ",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
    {/* <LeftNav /> */}
    <main className="flex-grow container mx-auto">

<Analytics />



    <Suspense fallback={null}>
      {children}
      </Suspense>
      </main>
  </div>

  );
}
