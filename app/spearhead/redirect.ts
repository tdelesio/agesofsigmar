'use server'
 
import { redirect } from 'next/navigation'
import { Phase } from './phase'
 
export async function navigateToTactics(faction: number) {
  redirect(`?faction=${faction}`)
}

export async function navigateToStart(faction: number, battleTraits: string, regimentAbilities: string, enhancements: string, usecards: string) {
redirect(`/phase?faction=${faction}&battleTraits=${battleTraits}&regimentAbilities=${regimentAbilities}&enhancements=${enhancements}&phase=${Phase.phases[0].id}&usecards=${usecards}`)

}