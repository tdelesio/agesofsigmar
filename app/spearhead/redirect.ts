'use server'
 
import { redirect } from 'next/navigation'
import { Phase } from '../shared/phase'
 
export async function redirectToSpearheadTacticsPage(factionId: number) {
  redirect(`/spearhead?faction=${factionId}`)
}

export async function redirectToSpearheadStartPhaseWithParameters(factionId: number, battleTraits: string, regimentAbilities: string, enhancements: string, useCards: string) {
redirect(`/spearhead/phase?faction=${factionId}&battleTraits=${battleTraits}&regimentAbilities=${regimentAbilities}&enhancements=${enhancements}&phase=${Phase.phases[0].id}&usecards=${useCards}`)
}
