import { Ability, Unit } from "./units";

export type Phase = {
    id: number;
    name: string;
    bgcolor: string;
    url: string;
}

export const phases = Object.freeze({
    start: 1,
    hero: 2,
    movement: 3,
    shooting: 4,
    charge: 5,
    combat: 6,
    end: 7,
    passive: 8,
    anycombat: 9,
    any: 10,

});

export type Phases = 'Passive' | 'Start' | 'Hero' | 'Movement' | 'Shooting' | 'Charge' | 'Combat' | 'End';

export const Phase = {
    "phases": [
        {
            "id": phases.start,
            "name": "Start of Turn",
            "bgcolor": "bg-black",
            "url": "/phase"
            },
        {
            "id": phases.hero,
            "name": "Hero Phase",
            "bgcolor": "bg-yellow-500",
            "url": "/phase"
        },
        {
            "id": phases.movement,
            "name": "Movement Phase",
            "bgcolor": "bg-gray-500",
            "url": "/phase"
        },
        {
            "id": phases.shooting,
            "name": "Shooting Phase",
            "bgcolor": "bg-green-800",
            "url": "/phase"
        },
        {
            "id": phases.charge,
            "name": "Charge Phase",
            "bgcolor": "bg-orange-500",
            "url": "/phase"
        },
        {
            "id": phases.combat,
            "name": "Combat Phase",
            "bgcolor": "bg-red-600",
            "url": "/phase"
        },
        {
            "id": phases.end,
            "name": "End of Turn",
            "bgcolor": "bg-purple-600",
            "url": "/phase"
        },
        

    ]
}


export function convertEnumToString(passedFaction: number): string {
    if (passedFaction === phases.start)
        return "start"
    else if (passedFaction === phases.hero)
        return "hero"
    else if (passedFaction === phases.movement)
        return "movement"
    else if (passedFaction === phases.shooting)
        return "shooting"
    else if (passedFaction === phases.charge)
        return "charge"
    else if (passedFaction === phases.combat)
        return "combat"
    else if (passedFaction === phases.end)
        return "end"
    else if (passedFaction === phases.passive)
        return "passive"
    else if (passedFaction === phases.anycombat)
        return "anycombat"
    else if (passedFaction === phases.any)
        return "any"
    else 
        return "unknown"
}



export function convertStringToEnum(passedFaction: string): number {
    if (passedFaction === 'start')
        return phases.start;
    else if (passedFaction === 'hero')
        return phases.hero;
    else if (passedFaction === 'movement')
        return phases.movement;
    else if (passedFaction === 'shooting')
        return phases.shooting;
    else if (passedFaction === 'charge')
        return phases.charge;
    else if (passedFaction === 'combat')
        return phases.combat
    else if (passedFaction === 'end')
        return phases.end
    else if (passedFaction === 'passive')
        return phases.passive
    else if (passedFaction === 'anycombat')
        return phases.anycombat
    else if (passedFaction === 'any')
        return phases.any
    else 
        return 0;
}

export function getAbilityForRound(unit: Unit, phase: number): Ability[] {
    switch (phase) {
        case phases.start:
            return unit.Start.abilities;
        case phases.hero:
            return unit.Hero.abilities;
        case phases.movement:
            return unit.Movement.abilities;
        case phases.shooting:
            return unit.Shooting.abilities;
        case phases.charge:
            return unit.Charge.abilities;
        case phases.combat:
            return unit.Combat.abilities;
        case phases.end:
            return unit.End.abilities;
        case phases.passive:
            return unit.Passive.abilities;
        default:
            return [];
    }
}
