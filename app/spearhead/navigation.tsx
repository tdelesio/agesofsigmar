'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Phase } from './phase'

  //Link to return to home page
  export function Home() {
    return (
      <Link className="text-black"
        href={{
          pathname: '/',

        }}
      >
        Start Over
      </Link>
    )
  }

export default function LeftNav() {
  const pathname = usePathname()

  const params = useSearchParams();
  const selectedFaction = params.get('faction');
  const selectedPhase = params.get('phase');
  const initialBattleTrait = params.get('battleTraits');
  const initialRegimentAbility = params.get('regimentAbilities');
  const initialEnhancment = params.get('enhancements');

  return (
    <nav className="w-64 bg-gray-100 h-screen p-4">
      <div className="space-y-2">
        {Phase.phases.map(phase => {
          const isActive = pathname === phase.url
          return (
            <Link
              key={phase.name}
              href={`${phase.url}?faction=${selectedFaction}&battleTraits=${initialBattleTrait}&regimentAbilities=${initialRegimentAbility}&enhancements=${initialEnhancment}&phase=${phase.id}`}
              className={`flex items-center p-3 rounded-lg transition-transform ${
                phase.bgcolor
              } text-white font-medium ${
                isActive ? 'scale-105 shadow-lg' : ''
              }`}
            >
              <span>{phase.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}