import { Enhancement } from "../factions";
import { Phase, phases } from "../phase";

export function showAbility(currentPhase: Phase | null, item: any): boolean {
    //return true if 
    //1.  the current round matches the item round
    //2.  The passed item is passive
    //3.  It is a combat round and it matches any of the combat tags
    // console.log(item.name, currentPhase?.id, item.phase, item)
    return currentPhase?.id === item.phase || item.phase === phases.passive || item.phase == phases.any || showCombat(currentPhase, item)
}

export function isCombatPhase(selectedPhase: Phase | null): boolean {
    return selectedPhase?.id === phases.combat || selectedPhase?.id === phases.shooting;
}

export function showCombat(selectedPhase: Phase | null, item: any): boolean {
    //return true if phase is combat and selected phase is combat or anycombat or phase is shooting and selected phase is shooting or anycombat
    return (selectedPhase?.id === phases.combat && (item.phase === phases.anycombat || item.phase === phases.combat)) || (selectedPhase?.id === phases.shooting && (item.phase === phases.anycombat || item.phase === phases.shooting))
}



export function showEnhancement(currentPhase: Phase | null, selectedEnhancement: Enhancement | null): boolean {
    return !isCombatPhase(currentPhase) && (selectedEnhancement?.phase === currentPhase?.id || selectedEnhancement?.phase === phases.passive);
}

export function showEnhancementOnCombatPhase(general: boolean | false, selectedPhase: Phase | null, selectedEnhancement: Enhancement | null): boolean {
    return general && showAbility(selectedPhase, selectedEnhancement)
    // return general && (selectedEnhancement?.phase === phases.passive || selectedEnhancement?.phase === phases.combat || selectedEnhancement?.phase === phases.shooting)
}
