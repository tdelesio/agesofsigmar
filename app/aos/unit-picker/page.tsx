"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Hero {
  id: string;
  name: string;
  // Add other properties as needed
}

export default function UnitPickerPage() {
  const searchParams = useSearchParams()
  const factionId = searchParams.get('faction')

  const [heroes, setHeroes] = useState<Hero[]>([])
  const [selectedHero, setSelectedHero] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeroes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/aos/factions/${factionId}/heroes.json`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Fetched heroes:', data) // Debug log
        setHeroes(data)
      } catch (e) {
        console.error('Error fetching heroes:', e)
        setError('Failed to load heroes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (factionId) {
      fetchHeroes()
    }
  }, [factionId])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Unit Picker</h1>
      
      {isLoading && <p>Loading heroes...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && factionId && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Regiment 1</h2>
          <div className="space-y-2">
            <Label htmlFor="hero-select">Select a Hero</Label>
            <Select onValueChange={setSelectedHero} value={selectedHero}>
              <SelectTrigger id="hero-select">
                <SelectValue placeholder="Select a hero" />
              </SelectTrigger>
              <SelectContent>
                {heroes.map(hero => (
                  <SelectItem key={hero.id} value={hero.id}>
                    {hero.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {!factionId && <p>No faction selected. Please go back and select a faction.</p>}
      
      {selectedHero && (
        <p className="mt-4">Selected Hero: {heroes.find(h => h.id === selectedHero)?.name}</p>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Debug Info:</h3>
        <p>Faction ID: {factionId || 'Not set'}</p>
        <p>Heroes loaded: {heroes.length}</p>
        <p>Selected Hero ID: {selectedHero || 'None'}</p>
      </div>
    </div>
  )
}