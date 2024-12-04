"use client"

import { useSearchParams } from 'next/navigation'
import Image from "next/image"
import Link from "next/link"
import SelectFactionForm from "./select-faction-form"
import SelectFactionTacticsForm from "./select-tactics"
import { Analytics } from "@vercel/analytics/react"

export default function HomePage() {
  const faction = useSearchParams().get('faction')

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <header className="sticky top-0 z-10 w-full bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Spearhead Helper</h1>
          <Link href="https://warhammer.com" target="_blank" rel="noopener noreferrer">
            <Image
              src="/wh.jpg"
              alt="Warhammer Logo"
              width={50}
              height={12}
              className="dark:invert"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <Analytics />
        {faction ? <SelectFactionTacticsForm /> : <SelectFactionForm />}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "https://www.warhammer-community.com/warhammer-age-of-sigmar-downloads/",
              title: "Downloads",
              description: "Find faction packs and game rules.",
            },
            {
              href: "https://www.warhammer.com/en-GB/spearhead",
              title: "Models",
              description: "See available models for your faction or start a new one.",
            },
            {
              href: "https://github.com/tdelesio/spearhead/issues",
              title: "Issues",
              description: "Bugs/Faction Requests/Feature Requests",
            },
            {
              href: "https://account.venmo.com/u/Tim-Delesio",
              title: "Thank Me",
              description: "Like what you see? Buy me a coffee.",
            },
          ].map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {item.title}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  →
                </span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
            </Link>
          ))}
        </div>

        
        
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Spearhead Helper. All rights reserved.
        </div>
      </footer>
    </div>
  )
}