import { factions, onces } from "./factions";
import { phases } from "./phase";

export interface FactionUnits {
    id: string;
    units: Unit[];
}

export interface Unit  {
    id: string;
    name: string;
    move: string;
    control: number;
    health: number;
    save: number;
    ward: number;
    hero: boolean;
    general: boolean;
    fly: false;
    keywords: string[];
    Passive: {
        attacks: Attack[];
        abilities: Ability[];
    };
    Start: {
        attacks: Attack[];
        abilities: Ability[];
    };
    Hero: {
        attacks: Attack[];
        abilities: Ability[];
    };
    Movement: {
        attacks: Attack[];
        abilities: Ability[];
    };
    Shooting: {
        attacks: Attack[];
        abilities: Ability[];
    };
    Charge: {
        attacks: Attack[];
        abilities: Ability[];
    };
    Combat: {
        attacks: Attack[];
        abilities: Ability[];
    };
    End: {
        attacks: Attack[];
        abilities: Ability[];
    };


}


export function getAttacksForRound(unit: Unit, phase: number): Attack[] {
    switch (phase) {
        case phases.shooting:
            return unit.Shooting.attacks;
        case phases.combat:
            return unit.Combat.attacks;
        default:
            return [];
    }
}

export interface Ability {
    id: string;
    name: string;
    effect: string;
    once: number;
    tags?: string[]; 
    phase?: number;
}

export interface Attack  {
    id: string;
    name: string;
    range: number;
    attacks: string;
    hit: number;
    wound: number;
    rend: number;
    damage: string;
    ability: string;
}

export const Units = {
    "factions": [
        {
            "id": factions.stormcastVigilantBrotherHood,
            units: [
                {

                    "id": "LordVigilant",
                    "name": "Lord Vigilant",
                    "move": "12",
                    "control": 2,
                    "health": 8,
                    "save": 3,
                    "ward": 0,
                    "hero": true,
                    "general": true,
                    "fly": false,
                    "keywords": ["Hero", "Cavalry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "PlanTheAttack",
                            "name": "Plan the Attack",
                            "effect": "Pick an objective you do not control.  For the rest of the turn, add 1 to hit rolls for combat attacks made by friendly units that target enemy units contesting that objective.",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": [{
                            "id": "DeliverJudgement",
                            "name": "Deliver Judgement",
                            "effect": "Pick a friendly wholly within 12\".  The target can use 2 Fight abilites this phase.  After the first is used, the target has Strike-Last",
                            "once": onces.battle,
                        }]
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "HallowedGreataxe",
                                "name": "Hallowed Greataxe",
                                "range": 0,
                                "attacks": "5",
                                "hit": 3,
                                "wound": 3,
                                "rend": 2,
                                "damage": "2",
                                "ability": ""
                            },
                            {
                                "id": "GryphStalkerBeakAndTalons",
                                "name": "Gryph-Stalker Beak and Talons",
                                "range": 0,
                                "attacks": 3,
                                "hit": 4,
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": "Companion"
                            }
                        ],
                        "abilities": [{
                            "id": "DeliverJudgement",
                            "name": "Deliver Judgement",
                            "effect": "Pick a friendly wholly within 12\".  The target can use 2 Fight abilites this phase.  After the first is used, the target has Strike-Last",
                            "once": onces.battle,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "LordVeritant",
                    "name": "Lord Veritant",
                    "move": "5",
                    "control": 2,
                    "health": 6,
                    "save": 3,
                    "ward": 0,
                    "hero": true,
                    "general": false,
                    "fly": false,
                    "keywords": ["Hero", "Priest", "Infantry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "SenseUnholySorcery",
                            "name": "Sense Unholy Sorcery",
                            "effect": "This unit's Gryph-crow is a token. This unit has Ward (5+) while its Gryph-crow is on the battlefield. If you make an unmodied ward roll of 1 for this unit, remove its Gryph-crow from the battlefield.  Click this ability if you roll a 1 to remove ward.",
                            "once": onces.battle,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "CleansingFires",
                            "name": "Cleansing Fires",
                            "effect": "Pick a visible enemy unit within 12\" and make a chanting roll of D6.  On a 3+, roll a dice for each model in the target unut.  For each 5+ inflict 1 mortal damage on target unit.",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "StaffOfAbjuration",
                                "name": "Staff Of Abjuration",
                                "attacks": 1,
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "3",
                                "ability": "",
                                "range": 0,
                            },
                            {
                                "id": "JudgementBlade",
                                "name": "Judgement Blade",
                                "attacks": "3",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "D3",
                                "ability": "Anit-Wizard (+1 Rend), Anit-Priest (+1 Rend)",
                                "range": 0,
                            }
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "Procecutors",
                    "name": "Procecutors",
                    "move": "12",
                    "control": 1,
                    "health": 2,
                    "save": 3,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": true,
                    "keywords": ["Infantry", "Fly", "Reinforcements"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "Skirmishers",
                            "name": "Skirmishers",
                            "effect": "The unit has a coherency range of 2\"",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": [{
                            "id": "callForReinforcement",
                            "name": "Call for Reinforcements",
                            "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                            "once": onces.battle,
                        }]
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "StormcaalJavelin",
                                "name": "Stormcast Javelin",
                                "range": 10,
                                "attacks": "1",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "D3",
                                "ability": ""
                            }
                        ],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "HearaldsOfRighteousness",
                                "name": "Hearalds Of Righteousness",
                                "effect": "When you make a charge roll for this unit, roll 1 additional dice.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "StormcastJavelin",
                                "name": "Stormcast Javelin",
                                "attacks": "3",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "",
                                "range": 0,
                            }
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "Liberators",
                    "name": "Liberators",
                    "move": "5",
                    "control": 1,
                    "health": 2,
                    "save": 3,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry", "Reinforcements"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "StalwartDefenders",
                            "name": "Stalwart Defenders",
                            "effect": "Add 3 to this unit's control score while it contests an objective wholly within friendly territor",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": [{
                            "id": "callForReinforcement",
                            "name": "Call for Reinforcements",
                            "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                            "once": onces.battle,
                        }]
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "Warhammer",
                                "name": "Warhammer",
                                "attacks": "2",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Crit (Mortal)",
                                "range": 0,
                            },
                            {
                                "id": "Grandhammer",
                                "name": "Grandhammer",
                                "attacks": "2",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": "Crit (Mortal)",
                                "range": 0,
                            }
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": [{
                            "id": "StalwartDefenders",
                            "name": "Stalwart Defenders",
                            "effect": "Add 3 to this unit's control score while it contests an objective wholly within friendly territor",
                            "once": onces.none,
                        }]
                    }

                }],




        },
        {
            "id": factions.skavenGnawfeastClawPack,
            "units": [

                {
                    "id": "clawLordOnGnawBeast",
                    "name": "Clawlord on Gnaw-beast",
                    "move": "9",
                    "control": 2,
                    "health": 7,
                    "save": 4,
                    "ward": 6,
                    "hero": true,
                    "general": true,
                    "fly": false,
                    "keywords": ["Hero", "Cavalry", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "corneredRat",
                            "name": "Cornered Rat",
                            "effect": "When this unit is damaged, add 3 to the Attacks characteristic of its Warpforged Halbred.",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "ratlingPistol",
                                "name": "Ratling Pistol",
                                "range": 10,
                                "attacks": "D6",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Crit (Auto-wound), Shoot in Combat"
                            }
                        ],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "WarforgedHalbred",
                                "name": "Warforged Halbred",
                                "range": 0,
                                "attacks": "5",
                                "hit": 3,
                                "wound": 4,
                                "rend": 1,
                                "damage": "2",
                                "ability": ""
                            },
                            {
                                "id": "Gnaw-beast Chised Fangs",
                                "name": "Gnaw-beast Chised Fangs",
                                "range": 0,
                                "attacks": "4",
                                "hit": 4,
                                "wound": 3,
                                "rend": 1,
                                "damage": "D3",
                                "ability": "Companion"
                            },

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {
                    "id": "greySeer",
                    "name": "Grey Seer",
                    "move": "6",
                    "control": 2,
                    "health": 5,
                    "save": 6,
                    "ward": 0,
                    "hero": true,
                    "general": false,
                    "fly": false,
                    "keywords": ["Hero", "Wizard", "Infantry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "willOfTheHornedRat",
                            "name": "Will Of The Horned Rat",
                            "effect": "Pick a friendly unit wholly within 13\" then roll a dice.  On a 3+, add the roll to the targets control score until the start of your next turn.",
                            "once": onces.none,
                        },
                        {
                            "id": "wither",
                            "name": "Wither",
                            "effect": "Pick a visable enemy unit within 13\" of this unit to be the target, then making a casting rolling 2D6.  On a 6+, inflict D3 mortal damage on the target.",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "warpstoneStaff",
                                "name": "Warpstone Staff",
                                "range": 0,
                                "attacks": "3",
                                "hit": 4,
                                "wound": 4,
                                "rend": 1,
                                "damage": "D3",
                                "ability": ""
                            },

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {
                    "id": "warlockEngineer",
                    "name": "Warlock Engineer",
                    "move": "6",
                    "control": 2,
                    "health": 5,
                    "save": 5,
                    "ward": 0,
                    "hero": true,
                    "general": false,
                    "fly": false,
                    "keywords": ["Hero", "Infantry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "warplockMusket",
                                "name": "Warplock Musket",
                                "range": 24,
                                "attacks": "2",
                                "hit": 3,
                                "wound": 3,
                                "rend": 2,
                                "damage": "D3",
                                "ability": "Crit (Auto-wound)"
                            }
                        ],
                        "abilities": [
                            {
                                "id": "more-moreWarpEnergy",
                                "name": "More More Warp Energy",
                                "effect": "When delcaring shoot and it has not used move ability this turn.  Roll a dice.  On a 2+, set the Damage characteristic of the Warplock Musket to 3 this phase.  On a 1, inflict D3 mortal damage to this unit.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "warpforgedDagger",
                                "name": "Warpforged Dagger",
                                "range": 0,
                                "attacks": "3",
                                "hit": 4,
                                "wound": 4,
                                "rend": 0,
                                "damage": "2",
                                "ability": ""
                            },

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {
                    "id": "clanrats",
                    "name": "Clanrats",
                    "move": "6",
                    "control": 1,
                    "health": 1,
                    "save": 5,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry", "Reinforcements"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": [{
                            "id": "callForReinforcement",
                            "name": "Call for Reinforcements",
                            "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                            "once": onces.battle,
                        }]
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "rustyBlade",
                                "name": "Rusty Blade",
                                "range": 0,
                                "attacks": "2",
                                "hit": 4,
                                "wound": 5,
                                "rend": 0,
                                "damage": "1",
                                "ability": ""
                            }
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": [{
                            "id": "seetingSwarm",
                            "name": "Seeting Swarm",
                            "effect": "You can return D3 slain models to this unit.",
                            "once": onces.none,
                        }]
                    }

                },
                {
                    "id": "ratOgors",
                    "name": "Rat Ogres",
                    "move": "6",
                    "control": 1,
                    "health": 4,
                    "save": 5,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "warpfireGun",
                                "name": "Warpfire Gun",
                                "range": 10,
                                "attacks": "2D6",
                                "hit": 2,
                                "wound": 4,
                                "rend": 2,
                                "damage": "1",
                                "ability": "Shoot in Combat"
                            }
                        ],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "clawsBladesAndFangs",
                                "name": "Claws Blades And Fangs",
                                "range": 0,
                                "attacks": "5",
                                "hit": 4,
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": ""
                            },

                        ],
                        "abilities": [{
                            "id": "unleashedWarpFury",
                            "name": "Unleashed Warp Fury",
                            "effect": "Inflict D3 mortal damage on this uniit.  Then add 1 to the attacks characteristic of its melee weapons this phase.",
                            "once": onces.battle,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },


            ]
        },
        {
            "id": factions.skavenWarpSparkClawPack,
            units: [
            {

                "id": "greySeer",
                "name": "Grey Seer",
                "move": "6",
                "control": 2,
                "health": 5,
                "save": 6,
                "ward": 0,
                "hero": true,
                "general": false,
                "fly": false,
                "keywords": ["Hero", "Wizard", "Infantry"],
                "Passive": {
                    "attacks": [],
                    "abilities": []
                },
                "Start":
                {
                    "attacks": [],
                    "abilities": []
                },
                "Hero": {
                    "attacks": [],
                    "abilities": [{
                        "id": "willOfTheHornedRat",
                        "name": "Will Of The Horned Rat",
                        "effect": "Pick a friendly unit wholly within 13\" then roll a dice.  On a 3+, add the roll to the targets control score until the start of your next turn.",
                        "once": onces.none,
                    },
                    {
                        "id": "wither",
                        "name": "Wither",
                        "effect": "Pick a visable enemy unit within 13\" of this unit to be the target, then making a casting rolling 2D6.  On a 6+, inflict D3 mortal damage on the target.",
                        "once": onces.none,
                    }]
                },
                "Movement": {
                    "attacks": [],
                    "abilities": []
                },
                "Shooting": {
                    "attacks": [],
                    "abilities": []
                },
                "Charge": {
                    "attacks": [],
                    "abilities": []
                },
                "Combat":
                {
                    "attacks": [
                        {
                            "id": "warpstoneStaff",
                            "name": "Warpstone Staff",
                            "range": 0,
                            "attacks": "3",
                            "hit": 4,
                            "wound": 4,
                            "rend": 1,
                            "damage": "D3",
                            "ability": ""
                        },                    
                    ],
                    "abilities": [],
                },
                "End": {
                    "attacks": [],
                    "abilities": []
                }

            },
            {

                "id": "stormfiends",
                "name": "Stormfiends",
                "move": "6",
                "control": 2,
                "health": 6,
                "save": 4,
                "ward": 0,
                "hero": false,
                "general": false,
                "fly": false,
                "keywords": ["Infantry"],
                "Passive": {
                    "attacks": [],
                    "abilities": [{
                        "id": "shockGauntlets",
                        "name": "Shock Gauntlets",
                        "effect": "Each time an attack with this unit's Shock Gauntlets score a critical hit, that attack scores D6 hits instead of 1 (make a wounds roll for each).",
                        "once": onces.none,
                    }]
                },
                "Start":
                {
                    "attacks": [],
                    "abilities": []
                },
                "Hero": {
                    "attacks": [],
                    "abilities": []
                },
                "Movement": {
                    "attacks": [],
                    "abilities": []
                },
                "Shooting": {
                    "attacks": [{
                        "id": "ratlingCannon",
                        "name": "Ratling Cannon",
                        "range": 15,
                        "attacks": "3D6",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "windLaunchers",
                        "name": "Wind Launchers",
                        "range": 15,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 2,
                        "damage": "D3",
                        "ability": ""
                    }
                ],
                    "abilities": []
                },
                "Charge": {
                    "attacks": [],
                    "abilities": []
                },
                "Combat":
                {
                    "attacks": [
                        {
                            "id": "shockGauntlets",
                            "name": "Shock Gauntlets",
                            "range": 0,
                            "attacks": "4",
                            "hit": 4,
                            "wound": 2,
                            "rend": 1,
                            "damage": "2",
                            "ability": ""
                        },
                        {
                            "id": "clubbingBlows",
                            "name": "Clubbing Blows",
                            "range": 0,
                            "attacks": "4",
                            "hit": 4,
                            "wound": 2,
                            "rend": 0,
                            "damage": "2",
                            "ability": ""
                        },
                        
                    ],
                    "abilities": [],
                },
                "End": {
                    "attacks": [],
                    "abilities": []
                }

            },
            {

                "id": "warpLightningCannon",
                "name": "Warp Lightning Cannon",
                "move": "3",
                "control": 2,
                "health": 8,
                "save": 4,
                "ward": 0,
                "hero": false,
                "general": false,
                "fly": false,
                "keywords": ["War Machine"],
                "Passive": {
                    "attacks": [],
                    "abilities": [{
                        "id": "warpLightningBlaster",
                        "name": "Warp Lightning Blaster",
                        "effect": "Each attack made with this weapon in a single phase must target the same enemy unit.  Each hit inflicts 1 mortal damage on the target and the attack sequence ends.",
                        "once": onces.none,
                    }]
                },
                "Start":
                {
                    "attacks": [],
                    "abilities": []
                },
                "Hero": {
                    "attacks": [],
                    "abilities": []
                },
                "Movement": {
                    "attacks": [],
                    "abilities": []
                },
                "Shooting": {
                    "attacks": [],
                    "abilities": [{
                        "id": "warpLightningBlaster",
                        "name": "Warp Lightning Blaster",
                        "range": 20,
                        "attacks": "2D6",
                        "hit": 4,
                        "wound": 0,
                        "rend": 0,
                        "damage": "0",
                        "ability": "see passive"
                    }]
                },
                "Charge": {
                    "attacks": [],
                    "abilities": []
                },
                "Combat":
                {
                    "attacks": [
                        {
                            "id": "crewsTeethAndKnives",
                            "name": "Crews Teeth And Knives",
                            "range": 0,
                            "attacks": "D6",
                            "hit": 4,
                            "wound": 5,
                            "rend": 0,
                            "damage": "1",
                            "ability": ""
                        },
                        
                    ],
                    "abilities": [],
                },
                "End": {
                    "attacks": [],
                    "abilities": []
                }

            },
            {

                "id": "clanrats",
                "name": "Clanrats",
                "move": "6",
                "control": 1,
                "health": 1,
                "save": 5,
                "ward": 0,
                "hero": false,
                "general": false,
                "fly": false,
                "keywords": ["Infantry", "Reinforcements"],
                "Passive": {
                    "attacks": [],
                    "abilities": []
                },
                "Start":
                {
                    "attacks": [],
                    "abilities": []
                },
                "Hero": {
                    "attacks": [],
                    "abilities": []
                },
                "Movement": {
                    "attacks": [],
                    "abilities": [{
                        "id": "callForReinforcement",
                        "name": "Call for Reinforcements",
                        "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                        "once": onces.battle,
                    }]
                },
                "Shooting": {
                    "attacks": [],
                    "abilities": []
                },
                "Charge": {
                    "attacks": [],
                    "abilities": []
                },
                "Combat":
                {
                    "attacks": [
                        {
                            "id": "rustyBlade",
                            "name": "Rusty Blade",
                            "range": 0,
                            "attacks": "2",
                            "hit": 4,
                            "wound": 5,
                            "rend": 0,
                            "damage": "1",
                            "ability": ""
                        }
                    ],
                    "abilities": [],
                },
                "End": {
                    "attacks": [],
                    "abilities": [{
                        "id": "seethingSwarm",
                        "name": "Seething Swarm",
                        "effect": "You can return D3 slain models to this unit.",
                        "once": onces.none,
                    }]
                }

            },
            ]
        },
        {
            id: factions.slaveToDarknessBloodWindLegion,
            units: [
                {

                    "id": "Chaos Lord",
                    "name": "Chaos Lord",
                    "move": "5",
                    "control": 2,
                    "health": 6,
                    "save": 3,
                    "ward": 0,
                    "hero": true,
                    "general": true,
                    "fly": false,
                    "keywords": ["Hero", "Infantry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "favouredOfThePantheon",
                            "name": "Favoured Of The Pantheon",
                            "effect": "Roll a dice.  On a 4+, you can roll on the Eye of the Gods table for this unti.",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "reaperblade",
                                "name": "Reaperblade",
                                "range": 0,
                                "attacks": "5",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": "Crit (Mortal)"
                            },
                        ],
                        "abilities": [{
                            "id": "ironWilledChampion",
                            "name": "Iron Willed Champion",
                            "effect": "Pick a friendly unit wholly within 12\" and roll a dice.  On a 2+, add 1 to the hit rolls for attacks made by this unit this phase.",
                            "once": onces.none,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "chaosChariot",
                    "name": "Chaos Chariot",
                    "move": "10",
                    "control": 2,
                    "health": 7,
                    "save": 4,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["War Machine"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": [{
                            "id": "swiftDeath",
                            "name": "Swift Death",
                            "effect": "If this unit charged this phase, pick an enemy unit within 1\" to be the target and roll the dice.  On a 2+, inflict D3 mortal damage on the target.",
                            "once": onces.none,
                        }]
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "chaosWarFlail",
                                "name": "Chaos War Flail",
                                "range": 0,
                                "attacks": "6",
                                "hit": 3,
                                "wound": 3,
                                "rend": 0,
                                "damage": "1",
                                "ability": ""
                            },
                            {
                                "id": "driversLashingWhip",
                                "name": "Drivers Lashing Whip",
                                "range": 0,
                                "attacks": "2",
                                "hit": 4,
                                "wound": 4,
                                "rend": 0,
                                "damage": "1",
                                "ability": ""
                            },
                            {
                                "id": "warhorsesTramplingHooves",
                                "name": "Warhorses Trampling Hooves",
                                "range": 0,
                                "attacks": "4",
                                "hit": 5,
                                "wound": 3,
                                "rend": 0,
                                "damage": "1",
                                "ability": "Companion"
                            }
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "chaosWarriors",
                    "name": "Chaos Warriors",
                    "move": "5",
                    "control": 1,
                    "health": 2,
                    "save": 3,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "bringersOfDesolation",
                            "name": "Bringers Of Desolation",
                            "effect": "Add 1 to wound rolls for combat attacks made by this unit that target an enemy unit that is contesting an objective you do not control.",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "runeEtchedHalbred",
                                "name": "Rune Etched Halbred",
                                "range": 0,
                                "attacks": "2",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": ""
                            }
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "chaosKnights",
                    "name": "Chaos Knights",
                    "keywords": ["Cavalry"],
                    "move": "10",
                    "control": 1,
                    "health": 4,
                    "save": 3,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": [{
                            "id": "impalingCharge",
                            "name": "Impaling Charge",
                            "effect": "If this unit charged this phase, add 1 to the Rend characteristic of this unit's Cursed Lance this phase.",
                            "once": onces.none,
                        }]
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "cursedLance",
                                "name": "Cursed Lance",
                                "range": 0,
                                "attacks": "3",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Charge (+1 Damage)"
                            },
                            {
                                "id": "chaosSteedTrampingHooves",
                                "name": "Chaos Steed Tramping Hooves",
                                "range": 0,
                                "attacks": "2",
                                "hit": 5,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Companion"
                            }
                        ],
                        "abilities": [{
                            "id": "impalingCharge",
                            "name": "Impaling Charge",
                            "effect": "If this unit charged this phase, add 1 to the Rend characteristic of this unit's melee weapons this phase.",
                            "once": onces.none,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
            ]
        },
        {
            "id": factions.daughtersOfKhaineHeartflayerTroupe,
            "units": [
                {

                    "id": "melusaaiIronscale",
                    "name": "Melusai Ironscale",
                    "move": "8",
                    "control": 2,
                    "health": 6,
                    "save": 5,
                    "ward": 6,
                    "hero": true,
                    "general": true,
                    "fly": false,
                    "keywords": ["Hero", "Infantry", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "allOutSlaughter",
                            "name": "All Out Slaughter",
                            "effect": "Pick a friendly unit wholly within 12\".  Until the start of your next turn, add 1 to hit rolls for combat attacks made by this target.",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "allOutSlaughter",
                            "name": "All Out Slaughter",
                            "effect": "Pick a friendly unit wholly within 12\".  Until the start of your next turn, add 1 to hit rolls for combat attacks made by this target.",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "keldrisaith",
                                "name": "Keldrisaith",
                                "range": 12,
                                "attacks": "2",
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "D3",
                                "ability": ""
                            }
                        ],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "keldrisaith",
                                "name": "Keldrisaith",
                                "range": 0,
                                "attacks": "6",
                                "hit": 3,
                                "wound": 4,
                                "rend": 1,
                                "damage": "2",
                                "ability": ""
                            },

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": [{
                            "id": "turnedToCrystal",
                            "name": "Turned To Crystal",
                            "effect": "Pick an Enemy unit with 1\" of this unit to target and roll a dice.  On a 2+ inflict 1 mortal damage on the target.",
                            "once": onces.none,
                        }]
                    }

                },
                {

                    "id": "bloodStalkers",
                    "name": "Blood Stalkers",
                    "move": "8",
                    "control": 1,
                    "health": 2,
                    "save": 5,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "heartSeekers",
                            "name": "Heart Seekers",
                            "effect": "Shooting attacks made by this unit score critical hit rolls on 5+ if this unit do not use a move this same turn.",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "heartSeekerBow",
                                "name": "Heart Seeker Bow",
                                "range": 18,
                                "attacks": "3",
                                "hit": 3,
                                "wound": 4,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Crit (Auto-wound)"
                            }
                        ],
                        "abilities": [
                            
                        ]
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "scianlar",
                                "name": "Scianlar",
                                "range": 0,
                                "attacks": "2",
                                "hit": "3",
                                "wound": 4,
                                "rend": 0,
                                "damage": "1",
                                "ability": ""
                            },

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "doomfireWarlocks",
                    "name": "Doomfire Warlocks",
                    "move": "14",
                    "control": 1,
                    "health": 3,
                    "save": 5,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Cavalry", "Reinforcements", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "doomfireBolt",
                            "name": "Doomfire",
                            "effect": "Pick a visibile enemy with 12\" of this unit to be the target and make a casting roll of 2D6.  On a 6+ inflict D3 mortal damage on the target.",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": [{
                            "id": "callForReinforcement",
                            "name": "Call for Reinforcements",
                            "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                            "once": onces.battle,
                        }]
                    },
                    "Shooting": {
                        "attacks": [
                            {
                                "id": "doomfireCrossbow",
                                "name": "Doomfire Crossbow",
                                "range": 10,
                                "attacks": "2",
                                "hit": 3,
                                "wound": 4,
                                "rend": 0,
                                "damage": "1",
                                "ability": ""
                            }
                        ],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "cursedScimitar",
                                "name": "Cursed Scimitar",
                                "range": 0,
                                "attacks": "2",
                                "hit": 3,
                                "wound": 4,
                                "rend": 1,
                                "damage": "1",
                                "ability": ""
                            },
                            {
                                "id": "darkSteedViciousBite",
                                "name": "Dark Steed Vicious Bite",
                                "range": 0,
                                "attacks": "2",
                                "hit": 5,
                                "wound": 3,
                                "rend": 0,
                                "damage": "1",
                                "ability": "Companion"
                            }

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "witchAelves",
                    "name": "Witch Aelves",
                    "move": "6",
                    "control": 1,
                    "health": 1,
                    "save": 6,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry", "Reinforcements", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "frenziedFervour",
                                "name": "Frenzied Fervour",
                                "effect": "Add 1 to Rend characteristic of this unit's melee weapon if they charged in the same turn.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": [{
                            "id": "callForReinforcement",
                            "name": "Call for Reinforcements",
                            "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                            "once": onces.battle,
                        }]
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "frenziedFervour",
                                "name": "Frenzied Fervour",
                                "effect": "Add 1 to Rend characteristic of this unit's melee weapon if they charged in the same turn.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "pairedSciansa",
                                "name": "Pair Sciansa",
                                "range": 0,
                                "attacks": "3",
                                "hit": 3,
                                "wound": 4,
                                "rend": 0,
                                "damage": "1",
                                "ability": "Crit (Auto-wound)"
                            },
                        ],
                        "abilities": [{
                            "id": "frenziedFervour",
                            "name": "Frenzied Fervour",
                            "effect": "Add 1 to Rend characteristic of this unit's melee weapon if they charged in the same turn.",
                            "once": onces.none,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
            ]
        },
        {
            "id": factions.fyreslayersSageAxeband,
            "units": [

                {

                    "id": "battlesmith",
                    "name": "Battlesmith",
                    "move": "4",
                    "control": 5,
                    "health": 5,
                    "save": 5,
                    "ward": 6,
                    "hero": true,
                    "general": true,
                    "fly": false,
                    "keywords": ["Infantry", "Hero", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "iconOfGrimnir",
                                "name": "Icon of Grimnir",
                                "effect": "Add 1 to save rolls for friendly units while they are wholly within 12\" of this unit.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "plantTheIcon",
                            "name": "Plant The Icon",
                            "effect": "For the rest of the turn, friednly units have ward 5+ while they are within 12\" of this unit.",
                            "once": onces.battle,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "ancestralBattleAxe",
                                "name": "Ancestral Battle Axe",
                                "range": 0,
                                "attacks": 5,
                                "hit": 3,
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": ""
                            },
                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "hearthguardBerzerkers",
                    "name": "Hearthguard Berzerkers",
                    "move": "4",
                    "control": 1,
                    "health": 2,
                    "save": 6,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "dutyUntoDeath",
                                "name": "Duty Unto Death",
                                "effect": "While your general is wholly within this unit's combat range, both this unit and your general have ward 5+",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "",
                            "name": "",
                            "effect": "",
                            "once": onces.battle,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "flamestrikePoleaxe",
                                "name": "Flamestrike Poleaxe",
                                "range": 0,
                                "attacks": 2,
                                "hit": "3",
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": "Crit (Mortal)"
                            },
                        ],
                        "abilities": [
                            {
                                "id": "dutyUntoDeath",
                                "name": "Duty Unto Death",
                                "effect": "While your general is wholly within this unit's combat range, both this unit and your general have ward 5+",
                                "once": onces.none,
                            }
                        ],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "vulkiteBerzerkers",
                    "name": "Vulkite Berzerkers",
                    "move": "4",
                    "control": 1,
                    "health": 2,
                    "save": 6,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": false,
                    "keywords": ["Infantry","Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "whirlwhindOfDestruction",
                                "name": "Whirlwind Of Destruction",
                                "effect": "Add 1 to the attack of this unit's melee weapoons if it charged in the same turn.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "",
                            "name": "",
                            "effect": "",
                            "once": onces.battle,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "whirlwhindOfDestruction",
                                "name": "Whirlwind Of Destruction",
                                "effect": "Add 1 to the attack of this unit's melee weapoons if it charged in the same turn.",
                                "once": onces.none,
                            }
                        ]
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "fyresteelHandaxes",
                                "name": "Fyresteel Handaxes",
                                "range": 0,
                                "attacks": "2",
                                "hit": 4,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Anti-charge (+1 Rend)"
                            },
                        ],
                        "abilities": [
                            {
                                "id": "whirlwhindOfDestruction",
                                "name": "Whirlwind Of Destruction",
                                "effect": "Add 1 to the attack of this unit's melee weapoons if it charged in the same turn.",
                                "once": onces.none,
                            }
                        ],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                }
            ]
        },
        {
            "id": factions.nighthauntSlasherHost,
            "units": [
                {

                    "id": "knightOfShrouds",
                    "name": "Knight of Shrouds",
                    "move": "8",
                    "control": 2,
                    "health": 5,
                    "save": 4,
                    "ward": 6,
                    "hero": true,
                    "general": true,
                    "fly": false,
                    "keywords": ["Infantry", "Hero", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "discorporate",
                            "name": "Discorporate",
                            "effect": "Pick a friendly unit wholly within 9\" of this unit to be the target.  Unit the start of the next turn, the target has Ward 5+",
                            "once": onces.none,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "swordOfStolenHours",
                                "name": "Sword of Stolen Hours  ",
                                "range": 0,
                                "attacks": 5,
                                "hit": 4,
                                "wound": 3,
                                "rend": 1,
                                "damage": "2",
                                "ability": "Crit (Auto-wound)"
                            },

                        ],
                        "abilities": [{
                            "id": "discorporate",
                            "name": "Discorporate",
                            "effect": "Pick a friendly unit wholly within 9\" of this unit to be the target.  Unit the start of the next turn, the target has Ward 5+",
                            "once": onces.none,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "spiritHosts",
                    "name": "Spirit Hosts",
                    "move": "8",
                    "control": 1,
                    "health": 3,
                    "save": 4,
                    "ward": 0,
                    "hero": false,
                    "general": false,
                    "fly": true,
                    "keywords": ["Infantry", "Fly", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "drawnToWar",
                            "name": "Drawn To War",
                            "effect": "Your general has Ward (4+) while they are within 1\" of this unit",
                            "once": onces.none,
                        }]
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "spectralClawsAndDaggers",
                                "name": "Spectral Claws and Daggers",
                                "range": 0,
                                "attacks": 6,
                                "hit": 4,
                                "wound": 4,
                                "rend": 0,
                                "damage": "1",
                                "ability": "Crit (Auto-wound)"
                            },

                        ],
                        "abilities": [],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {
                    "id": "grimghastReapers",
                    "name": "Grimghast Reapers",
                    "move": "8",
                    "control": 1,
                    "health": 1,
                    "save": 4,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": true,
                    "keywords": ["Infantry", "Fly", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": [{
                            "id": "reapedLikeCorn",
                            "name": "Reaped Like Corn",
                            "effect": "Combat attacks made by this unit score ciritcal hits on unmodified hit rolls of 5+ if the target unit has 5 or more models.",
                            "once": onces.battle,
                        }]
                    },
                    "Start": {

                        "attacks": [],
                        "abilities": [],
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "slasherScythe",
                                "name": "Slash Scythe",
                                "range": 0,
                                "attacks": 2,
                                "hit": 4,
                                "wound": 3,
                                "rend": 1,
                                "damage": "1",
                                "ability": "Crit (Auto-wound)"
                            },

                        ],
                        "abilities": [{
                            "id": "reapedLikeCorn",
                            "name": "Reaped Like Corn",
                            "effect": "Combat attacks made by this unit score ciritcal hits on unmodified hit rolls of 5+ if the target unit has 5 or more models.",
                            "once": onces.battle,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
                {

                    "id": "chainrasps",
                    "name": "Chainrasps",
                    "move": "8",
                    "control": 1,
                    "health": 1,
                    "save": 5,
                    "ward": 6,
                    "hero": false,
                    "general": false,
                    "fly": true,
                    "keywords": ["Infantry", "Fly", "Reinforcements", "Ward (6+)"],
                    "Passive": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Start":
                    {
                        "attacks": [],
                        "abilities": []
                    },
                    "Hero": {
                        "attacks": [],
                        "abilities": [{
                            "id": "chillingHorde",
                            "name": "Chilling Horde",
                            "effect": "Add 1 to wound rolls for combat attacks made by this unit if it charged in the same turn.",
                            "once": onces.battle,
                        }]
                    },
                    "Movement": {
                        "attacks": [],
                        "abilities": [{
                            "id": "callForReinforcement",
                            "name": "Call for Reinforcements",
                            "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                            "once": onces.battle,
                        }]
                    },
                    "Shooting": {
                        "attacks": [],
                        "abilities": []
                    },
                    "Charge": {
                        "attacks": [],
                        "abilities": [
                            {
                                "id": "chillingHorde",
                                "name": "Chilling Horde",
                                "effect": "Add 1 to wound rolls for combat attacks made by this unit if it charged in the same turn.",
                                "once": onces.battle,
                            }
                        ]
                    },
                    "Combat":
                    {
                        "attacks": [
                            {
                                "id": "malignantWeapon",
                                "name": "Malignant Weapon",
                                "range": 0,
                                "attacks": 2,
                                "hit": 4,
                                "wound": 5,
                                "rend": 0,
                                "damage": "1",
                                "ability": "Crit (Auto-wound)"
                            },

                        ],
                        "abilities": [{
                            "id": "chillingHorde",
                            "name": "Chilling Horde",
                            "effect": "Add 1 to wound rolls for combat attacks made by this unit if it charged in the same turn.",
                            "once": onces.battle,
                        }],
                    },
                    "End": {
                        "attacks": [],
                        "abilities": []
                    }

                },
               
            ]
        },
        {
            "id": factions.gloomspiteGitzBadMoonMadmob,
            "units": [{

            "id": "loonBoss",
            "name": "Loon Boss",
            "move": "5",
            "control": 2,
            "health": 5,
            "save": 4,
            "ward": 6,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry", "Ward (6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "ImDaBoss",
                    "name": "I'm Da Boss",
                    "effect": "Pick a friendly Moonclan Stabbas unit wholly within 12\" of this unit.  Pick either Beckon the Loonic Horders:  If the target unit is not in combat, you can return D6 slain models to it.  OR  Stab Em Good: Add 1 to hit rolls for attacks made by this unit until the end of the phase.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "moonSlicer",
                        "name": "Moon Slicer",
                        "range": 0,
                        "attacks": "5",
                        "hit": 4,
                        "wound": 4,
                        "rend": 1,
                        "damage": "D3",
                        "ability": ""
                    },                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "squiqHopper",
            "name": "Squiq Hopper",
            "move": "D6+8",
            "control": 1,
            "health": 2,
            "save": 6,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Cavalry", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "boingBoingBoing",
                    "name": "Boing Boing Boing",
                    "effect": "Pick an enemy unit that any models in this unit passed across across this phase to be the target, then roll a dice for each model in that unit.  For each 4+, inflict 1 mortal damage on that unit.",
                    "once": onces.none,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "slitta",
                        "name": "Slitta",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 5,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "squiqFangFilledGob",
                        "name": "Squiq Fang Filled Gob",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "rockgutTroggoths",
            "name": "Rockgut Troggoths",
            "move": "6",
            "control": 2,
            "health": 5,
            "save": 4,
            "ward": 5,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Ward (5+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": [{
                    "id": "regeneration",
                    "name": "Regeneration",
                    "effect": "Heal D3 to this unit.",
                    "once": onces.none,
                }]
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "throwinBoulders",
                    "name": "Throwin' Boulders",
                    "range": 10,
                    "attacks": "1",
                    "hit": 5,
                    "wound": 2,
                    "rend": 2,
                    "damage": "D3",
                    "ability": ""
                }],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "massiveStoneMaul",
                        "name": "Massive Stone Maul",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "3",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "moonclanStabbas",
            "name": "Moonclan Stabbas",
            "move": "5",
            "control": 1,
            "health": 1,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": [{
                    "id": "netters",
                    "name": "Netters",
                    "effect": "Pick an enemry infantry unit in combat with this unit. to get the target.  Roll a dice, on 2+, subtract 1 from hit rolls for attack modifiers made by the target this phase.",
                    "once": onces.battle,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "stabba",
                        "name": "Stabba",
                        "range": 0,
                        "attacks": "2",
                        "hit": "4",
                        "wound": "5",
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [{
                    "id": "netters",
                    "name": "Netters",
                    "effect": "Pick an enemry infantry unit in combat with this unit. to get the target.  Roll a dice, on 2+, subtract 1 from hit rolls for attack modifiers made by the target this phase.",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
    ]},
    {
        "id": factions.stormcastYndrastra,
        units: [
        {

            "id": "yndrastra",
            "name": "Yndrastra",
            "move": "12",
            "control": 2,
            "health": 8,
            "save": 3,
            "ward": 6,
            "hero": true,
            "general": true,
            "fly": true,
            "keywords": ["Hero", "Infantry", "Fly", "Ward (6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "thengavar",
                    "name": "Thangavar",
                    "range": 12,
                    "attacks": "1",
                    "hit": 3,
                    "wound": 2,
                    "rend": 2,
                    "damage": "4",
                    "ability": "Shoot in Combat"
                }],
                "abilities": [{
                    "id": "champioinOfSigmar",
                    "name": "Champioin of Sigmar",
                    "effect": "This unit has ward (5+) this phase.",
                    "once": onces.battle,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "bladeOfTheHighHeavens",
                        "name": "Blade of the High Heavens",
                        "range": 0,
                        "attacks": "5",
                        "hit": 3,
                        "wound": 3,
                        "rend": 2,
                        "damage": "4",
                        "ability": ""
                    },
                    {
                        "id": "thengavar",
                        "name": "Thangavar",
                        "range": 12,
                        "attacks": "1",
                        "hit": 3,
                        "wound": 2,
                        "rend": 2,
                        "damage": "4",
                        "ability": "Shoot in Combat"
                    }
                    
                ],
                "abilities": [{
                    "id": "champioinOfSigmar",
                    "name": "Champioin of Sigmar",
                    "effect": "This unit has ward (5+) this phase.",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "vanquishers",
            "name": "Vanquishers",
            "move": "5",
            "control": 1,
            "health": 2,
            "save": 3,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "lightningStrikes",
                    "name": "Lightning Strikes",
                    "effect": "Add 1 to the Damage chararacterstic of this unit's Celestrial Greatswords for the attacks that target an enemy unit that has 5 or more models.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "celestialGreatsword",
                        "name": "Celestial Greatsword",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "knightVexillor",
            "name": "Knight Vexillor",
            "move": "5",
            "control": 5,
            "health": 6,
            "save": 3,
            "ward": 0,
            "hero": true,
            "general": false,
            "fly": false,
            "keywords": ["Hero", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "bannerOfTheReforged",
                    "name": "Banner of the Reforged",
                    "effect": "Pick a friendly unit wholly within 12\" of this unit to be the target.  Heal (D3) the target, add 3 to that unit's control score until the start of your next turn.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "sigmariteWarblade",
                        "name": "Sigmarite Warblade",
                        "range": 0,
                        "attacks": "4",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "annihilators",
            "name": "Annihilators",
            "move": "4",
            "control": 1,
            "health": 3,
            "save": 2,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [{
                    "id": "forceOfTheFallingStar",
                    "name": "Force of the Falling Star",
                    "effect": "If this unit charged this phae and the unmodified charge roll was 8+, pick an enemy unit within 1\" of it to be the target.  The target has STRIKE-LAST this turn.",
                    "once": onces.none,
                }]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "metoricHammer",
                        "name": "Metoric Hammer",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                ],
                "abilities": [{
                    "id": "",
                    "name": "",
                    "effect": "",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "stromstrikeChariot",
            "name": "Stromstrike Chariot",
            "move": "10",
            "control": 2,
            "health": 10,
            "save": 3,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["War Machine"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "greatStormbow",
                    "name": "Great Stormbow",
                    "range": 18,
                    "attacks": "2",
                    "hit": 3,
                    "wound": 3,
                    "rend": 1,
                    "damage": "1",
                    "ability": ""
                }],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [{
                    "id": "azyrUnleashed",
                    "name": "Azyr Unleashed",
                    "effect": "If this unit charged this phase, pick an enemy unit within 1\" of it to be the target and roll a dice.  On a 2+, inflict D3 mortal wounds on that unit.",
                    "once": onces.none,
                }]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "stromStrikeAxe",
                        "name": "Strom Strike Axe",
                        "range": 0,
                        "attacks": 3,
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },  
                    {
                        "id": "gryphChargersBeaksAndClaws",
                        "name": "Gryph-Chargers Beaks and Claws",
                        "range": 0,
                        "attacks": "6",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "companion"
                    },                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.soulblightGravelordsBloodCraveHunt,
        units: [
        {

            "id": "vampireLord",
            "name": "Vampire Lord",
            "move": "6",
            "control": 2,
            "health": 5,
            "save": 3,
            "ward": 6,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry", "Wizard", "Vampire", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "vileTransference",
                    "name": "Vile Transference",
                    "effect": "Pick a visbile enemy unit within 6\" of thisunit to be the target, then make a casting roll of 2D6.  On a 6+, roll a number of dice equal to the target's health.  For each 5+, inflict 1 mortal data on the target and Heal(1) this unit.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "dynasticWarRelic",
                        "name": "Dynastic War Relic",
                        "range": 0,
                        "attacks": "5",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "bloodKnight",
            "name": "Blood Knight",
            "move": "10",
            "control": 1,
            "health": 3,
            "save": 3,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Calvary", "Vampire", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "riderOfRuin",
                    "name": "Rider of Ruin",
                    "effect": "Models in this unit can pass across enemy infantry models as if this unit had FLY.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "templarLanceOrTemplarSword",
                        "name": "Templar Lance/Sword",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "nightmaresHoovesAndTeeth",
                        "name": "Nightmare's Hooves and Teeth",
                        "range": 0,
                        "attacks": "3",
                        "hit": 5,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "vargheists",
            "name": "Vargheists",
            "move": "12",
            "control": 1,
            "health": 4,
            "save": 5,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Infantry", "Vampire", "Ward(6+)", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "theScrentOfGore",
                    "name": "The Scrent of Gore",
                    "effect": "Add 1 to wound rolls for attacks made by this unit that target a damaged unit.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "murderousFangsAndTalons",
                        "name": "Murderous Fangs and Talons",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Crit (2 Hit)"
                    },                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "deathrattleSkeletons",
            "name": "Deathrattle Skeletons",
            "move": "4",
            "control": 1,
            "health": 1,
            "save": 5,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "ancientWeapon",
                        "name": "Ancient Weapon",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                ],
                "abilities": [{
                    "id": "skeletonLegion",
                    "name": "Skeleton Legion",
                    "effect": "For each slain model from this unit, make a legion roll of D6.  For each 5+, return 1 slain model to this unit.",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.maggotkinOfNurgleBleakHost,
        units: [
        {

            "id": "spoilpoxScivener",
            "name": "Spoilpox Scivener",
            "move": "4",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 5,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry", "Ward(5+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "keepCountingImWatchingYou",
                    "name": "Keep Counting, I'm Watching You",
                    "effect": "Pick a friendly Plaguebearer unit wholly within 14\" of this unit to be the target.  Pick 1 of the following.  The effect lasts unti the start of your next turn.  Tally of Blows:  Add 1 to the Attack characteristric of the target unit's melee weapon.  Recorded Stamina:  Add 1 to save rolls for the target unit.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "disgustingSneezes",
                        "name": "Disgusting Sneezes",
                        "range": 7,
                        "attacks": "D6",
                        "hit": 2,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    }
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "distendedMaw",
                        "name": "Distended Maw",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Cal"
                    },
                    {
                        "id": "disgustingSneezes",
                        "name": "Disgusting Sneezes",
                        "range": 7,
                        "attacks": "D6",
                        "hit": 2,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "pusgoyleBlightlord",
            "name": "Pusgoyle Blightlord",
            "move": "8",
            "control": 2,
            "health": 8,
            "save": 4,
            "ward": 5,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Calvary", "Fly", "Ward(5+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [{
                    "id": "wrackAndRuin",
                    "name": "Wrack and Ruin",
                    "effect": "If this unit charged this phase, pick an enemy unit within 1\" of it to be the target and roll a dice.  On a 2+, inflict D3 mortal damage on the target.",
                    "once": onces.none,
                }]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "blightedScythe",
                        "name": "Blighted Scythe",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 2,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "rotFlysMouthPasteAndString",
                        "name": "Rot Fly's Mouthpaste and String",
                        "range": 0,
                        "attacks": "6",
                        "hit": 4,
                        "wound": 2,
                        "rend": 0,
                        "damage": "1",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "putridBlightKings",
            "name": "Putrid Blightking",
            "move": "4",
            "control": 1,
            "health": 3,
            "save": 3,
            "ward": 5,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Ward(5+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "blightedWeapon",
                        "name": "Blighted Weapon",
                        "range": 0,
                        "attacks": "4",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": [{
                    "id": "relentlessAttackers",
                    "name": "Relentless Attackers",
                    "effect": "Pick an enemy INFANTRY unit in combat with this unit to be the target and roll a dice for each model in this unit that is within the target unit's combat range.  For each roll that exceends the target's Health characteristic, inflict 1 mortal damage on the target.",
                    "once": onces.none,
                }]
            }

        },
        {

            "id": "plaguebearers",
            "name": "Plaguebearers",
            "move": "4",
            "control": 1,
            "health": 2,
            "save": 6,
            "ward": 5,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Ward(5+)"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "cloudOfFlies",
                    "name": "Cloud of Flies",
                    "effect": "Subtract 1 from hit rolls for shooting attacks that target this unit.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "plaguesword",
                        "name": "Plaguesword",
                        "range": 0,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Crit (Mortal Damage)"
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.kharadronOverlordsSkyhammerTaskForce,
        units: [
        {

            "id": "arkanautAdmiral",
            "name": "Arkanaut Admiral",
            "move": "4",
            "control": 2,
            "health": 6,
            "save": 3,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "alwaysTakeWhatYouAreOwed",
                    "name": "Always Take What You Are Owed",
                    "effect": "Pick a friendly Arkanaut Company unit wholly within 12\" of this unit to be the target.  Add D6 to the target's control score until the start of your next turn.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "masterworkVolleyPistol",
                        "name": "Masterwork Volley Pistol",
                        "range": 10,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Shoot in Combat"
                    }
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "skalhammer",
                        "name": "Skalhammer",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 2,
                        "rend": 1,
                        "damage": "3",
                        "ability": ""
                    },
                    {
                        "id": "masterworkVolleyPistol",
                        "name": "Masterwork Volley Pistol",
                        "range": 10,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Shoot in Combat"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "skywardens",
            "name": "Skywardens",
            "move": "12",
            "control": 1,
            "health": 2,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Infantry", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "vulcaniserPistol",
                        "name": "Vulcaniser Pistol",
                        "range": 10,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "aethermaticVolleyGun",
                        "name": "Aethermatic Volley Gun",
                        "range": 15,
                        "attacks": "2D6",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "vulcaniserPistol",
                        "name": "Vulcaniser Pistol",
                        "range": 10,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "skypike",
                        "name": "Skypike",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Crit (Mortal Damage)"
                    },
                    {
                        "id": "gunButt",
                        "name": "Gun Butt",
                        "range": 0,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 5,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": [{
                    "id": "timedCharge",
                    "name": "Timed Charge",
                    "effect": "Pick an enemy unit in combat with this unit to be the target, then roll a dice.  On a 2+, inflict 1 mortal damage on the target and this unit can immediately use the RETREAT ability without any mortal damage being inflicted on it.",
                    "once": onces.battle,
                }]
            }

        },
        {

            "id": "arkanautCompany",
            "name": "Arkanaut Company",
            "move": "4",
            "control": 1,
            "health": 1,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "glorySeekers",
                    "name": "Glory Seekers",
                    "effect": "Add 1 to hit rolls for attacks made by this unit that target this unit contesting an objective.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "privateerPistol",
                        "name": "Privateer Pistol",
                        "range": 10,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "aethermaticVolleyGun",
                        "name": "Aethermatic Volley Gun",
                        "range": 15,
                        "attacks": "2D6",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "lightSkyhook",
                        "name": "Light Skyhook",
                        "range": 15,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 3,
                        "rend": 2,
                        "damage": "D3",
                        "ability": ""
                    }
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "privateerPistol",
                        "name": "Privateer Pistol",
                        "range": 10,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "arkanautCutter",
                        "name": "Arkanaut Cutter",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "gunButt",
                        "name": "Gun Butt",
                        "range": 0,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 5,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "skypike",
                        "name": "Skypike",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Crit (Mortal Damage)"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "arkanautFrigate",
            "name": "Arkanaut Frigate",
            "move": "12",
            "control": 5,
            "health": 15,
            "save": 3,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["WarMachine", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "battleDamaged",
                    "name": "Battle Damaged",
                    "effect": "While this unit has 10 or more damage points, the attack characteristic of its Heavy Skyhook is 1.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "bombRacks",
                    "name": "Bomb Racks",
                    "effect": "Pick an enemy unit that this unit passed across this phase to be the target, then roll a dice.  On a 2+, inflict D3 mortal damage on the target.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [{
                    "id": "heavySkyhook",
                    "name": "Heavy Skyhook",
                    "range": 24,
                    "attacks": "2",
                    "hit": 4,
                    "wound": 3,
                    "rend": 2,
                    "damage": "D6",
                    "ability": ""
                },
                {
                    "id": "aethershotCarbines",
                    "name": "Aethershot Carbines",
                    "range": 12,
                    "attacks": "4",
                    "hit": 3,
                    "wound": 3,
                    "rend": 1,
                    "damage": "2",
                    "ability": "Shoot in Combat"
                }
            ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "aethershotCarbines",
                        "name": "Aethershot Carbines",
                        "range": 12,
                        "attacks": "4",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "crewsBordingWeapons",
                        "name": "Crew's Bording Weapons",
                        "range": 0,
                        "attacks": "8",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.disciplesOfTzeentchFluxbladeCoven,
        units: [
        {

            "id": "MagisterOnDiscOfTzeentch",
            "name": "Magister on Disc of Tzeentch",
            "move": "14",
            "control": 2,
            "health": 6,
            "save": 4,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": true,
            "keywords": ["Hero", "Wizard", "Cavalry", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "boltOfChange",
                    "name": "Bolt of Change",
                    "effect": "Pick a visible enemy unit within 18\" of this unit to be the target, then make a casting roll of 2D6.  On a 6+, inflict D3 mortal damage on the target.  If any models are slain by this ability, you can pick a friendly Tazzangors unit wholly within 18\" of this unit and return 1 slain model to the Tazaangors unit.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "tzeentchainRunestaff",
                    "name": "Tzeentchain Runestaff",
                    "range": 18,
                    "attacks": "1",
                    "hit": 3,
                    "wound": 4,
                    "rend": 0,
                    "damage": "D3",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "warpsteelSword",
                        "name": "Warsteel Sword",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "D3",
                        "ability": ""
                    },
                    {
                        "id": "discsTeethAndHorns",
                        "name": "Disc's Teeth and Horns",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "D3",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "kairicAcolytes",
            "name": "Kairic Acolytes",
            "move": "5",
            "control": 2,
            "health": 1,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "sorcerousBolts",
                        "name": "Sorcerous Bolts",
                        "range": 18,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [{
                    "id": "gestaltSorcery",
                    "name": "Gestalt Sorcery",
                    "effect": "Make a ccasting roll of 2D6.  On a 6+, add 1 to the Rend Characteristic of this unit's Sorcerous Bolts this phase.",
                    "once": onces.battle,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "cursedBlade",
                        "name": "Cursed Blade",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                   
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "screamersOfTzeentch",
            "name": "Screamers of Tzeentch",
            "move": "",
            "control": 1,
            "health": 3,
            "save": 5,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Beast", "Fly", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "slashingFins",
                    "name": "Slashing Fins",
                    "effect": "Pick an enemy unit that any models in this unit passed across this phase to be the target, then roll a dice for each model unit that did so.  For each 4+, inflict 1 mortal damage on the target.",
                    "once": onces.none,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "lampreyBite",
                        "name": "Lamprey Bite",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "tzaangors",
            "name": "Tzaangors",
            "move": "6",
            "control": 1,
            "health": 2,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "longPlannedStrike",
                    "name": "Long Planned Strike",
                    "effect": "While this unit is wholly within enemy territory, its melee weapons have a Crit (2 Hits)",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "savageBladeAndViciousBeak",
                        "name": "Savage Blade and Vicious Beak",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "flamersOfTzeentch",
            "name": "Flamers of Tzeentch",
            "move": "9",
            "control": 1,
            "health": 2,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Fly", "Ward (6+)"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "capriciousWyrdFlame",
                    "name": "Capricious WyrdFlame",
                    "effect": "Add 1 to hit rolls for attacks made by this unit if the target unit has 5 or more models",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [ {
                    "id": "wyrdflame",
                    "name": "Wyrdflame",
                    "range": 12,
                    "attacks": "3",
                    "hit": 3,
                    "wound": 4,
                    "rend": 0,
                    "damage": "D3",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "flamingMaws",
                        "name": "Flaming Maws",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.orrukWarclans,
        units: [
        {

            "id": "killabossOnGreatGnashtoof",
            "name": "Killaboss on Great Gnashtoof",
            "move": "10",
            "control": 2,
            "health": 10,
            "save": 3,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Cavalry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "allPartOfDaPlan",
                    "name": "All Part of Da Plan",
                    "effect": "Pick a friendly unit wholly within 9\" of this unit be the target.  You cannot pick this unit.  Add 3 to the target's control score until the start of your next turn.",
                    "once": onces.battle,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "jaggedBosStikka",
                        "name": "Jagged Boss-Stikka",
                        "range": 0,
                        "attacks": "4",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Crit(Mortal)"
                    },
                    {
                        "id": "gnashhoofsBoneCrushingFangs",
                        "name": "Gnashtoof's Bone-crushing Fangs",
                        "range": 0,
                        "attacks": "5",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "beastSkewerKillbow",
            "name": "Beast-Skewer Killbow",
            "move": "5",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["War Machine"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "skewered",
                    "name": "Skewered",
                    "effect": "The damage characteristic of this unit's Beast-skewer Bolts is 6 instead of D6 if the target is a MONSTER.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "beastSkewerBolts",
                    "name": "Beast Skewer Bolts",
                    "range": 24,
                    "attacks": "2",
                    "hit": 4,
                    "wound": 2,
                    "rend": 2,
                    "damage": "D6",
                    "ability": "Crit (Auto-wound)"
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "jaggedyBlades",
                        "name": "Jaggedy Blades",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Crit (Mortal)"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "murknobWithBelchaBanna",
            "name": "Murknob with Belcha-Banna",
            "move": "5",
            "control": 5,
            "health": 6,
            "save": 4,
            "ward": 0,
            "hero": true,
            "general": false,
            "fly": false,
            "keywords": ["Hero", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": [{
                    "id": "breathOfTheMireDrakes",
                    "name": "Breath of the Mire-Drakes",
                    "effect": "Roll a dice of each enemy unit in combat with this unit.  On a 1, nothing happens.  On a 2-5, inflict 1 mortal damage on that enemy unit.  On a 6, inflict D3 mortal damage on that unit.",
                    "once": onces.none,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "murknobCleaver",
                        "name": "Murnob Cleaver",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Crit (Mortal)"
                    },
                
                ],
                "abilities": [{
                    "id": "breathOfTheMireDrakes",
                    "name": "Breath of the Mire-Drakes",
                    "effect": "Roll a dice of each enemy unit in combat with this unit.  On a 1, nothing happens.  On a 2-5, inflict 1 mortal damage on that enemy unit.  On a 6, inflict D3 mortal damage on that unit.",
                    "once": onces.none,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "gutrippaz",
            "name": "Gutrippaz",
            "move": "5",
            "control": 1,
            "health": 2,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": [{
                    "id": "scareTaktikz",
                    "name": "Scare Taktikz",
                    "effect": "Roll a dice.  On a 3+, subtract 1 from hit rolls for atacks that target this unit this phase.  This ability has no effect on attacks made by HEROS.",
                    "once": onces.battle,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "wickedHacka",
                        "name": "Wicked Hacka",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Crit (Mortal)"
                    },
                  
                ],
                "abilities": [{
                    "id": "scareTaktikz",
                    "name": "Scare Taktikz",
                    "effect": "Roll a dice.  On a 3+, subtract 1 from hit rolls for atacks that target this unit this phase.  This ability has no effect on attacks made by HEROS.",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "manSkewerBoltBoyz",
            "name": "Man-Skewer Boltboyz",
            "move": "5",
            "control": 1,
            "health": 2,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "pickemOff",
                    "name": "Pick'em Off",
                    "effect": "Add 1 to hit rolls for this unit's shooting attacks if has not used a moved ability this turn.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "pickemOff",
                    "name": "Pick'em Off",
                    "effect": "Add 1 to hit rolls for this unit's shooting attacks if has not used a moved ability this turn.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "manskewerCrossbow",
                        "name": "Man-skewer Crossbow",
                        "range": 18,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Crit (Auto-wound)"
                    },
                ],
                "abilities": [{
                    "id": "pickemOff",
                    "name": "Pick'em Off",
                    "effect": "Add 1 to hit rolls for this unit's shooting attacks if has not used a moved ability this turn.",
                    "once": onces.battle,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "jaggedyBlade",
                        "name": "Jaggedy Blade",
                        "range": 0,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Crit (Mortal)"
                    },
                  
                ],
                "abilities": [{
                    "id": "scareTaktikz",
                    "name": "Scare Taktikz",
                    "effect": "Roll a dice.  On a 3+, subtract 1 from hit rolls for atacks that target this unit this phase.  This ability has no effect on attacks made by HEROS.",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },

    {
        "id": factions.seraphonStarscaleWarhost,
        units: [
        {

            "id": "saurusOldbloodOnCarnosaur",
            "name": "Saurus Oldblood on Carnosaur",
            "move": "10",
            "control": 5,
            "health": 14,
            "save": 5,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Monster"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "ancientWarlord",
                    "name": "Ancient Warlord",
                    "effect": "Pick a friendly unit wholly within 12\" of this unit to be the target.  You cannot pick this unit.  Unit the start of your next turn, add 1 to the charge rolls for that target.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "sunboltGauntlet",
                        "name": "Sunbolt Gauntlet",
                        "range": 12,
                        "attacks": "D6",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    }
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "sunboltGauntlet",
                        "name": "Sunbolt Gauntlet",
                        "range": 12,
                        "attacks": "D6",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "relicCelestiteWeapon",
                        "name": "Relic Celestite Weapon",
                        "range": 0,
                        "attacks": "5",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "carnosaurMassiveJaws",
                        "name": "carnosaur's Massive Jaws",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "3",
                        "ability": "companion"
                    }
                ],
                "abilities": [{
                    "id": "battleDamaged",
                    "name": "Battle Damaged",
                    "effect": "While this unit has 10 or more damage points, the Attack Characteristic of its Carnosaur's Massive Jaws is 1.",
                    "once": onces.none,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "saurusWarriors",
            "name": "Saurus Warriors",
            "move": "5",
            "control": 1,
            "health": 2,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [
                    {
                    "id": "orderedCohorts",
                    "name": "Ordered Cohorts",
                    "effect": "Add 1 to save rolls for this unit while it is contesting an objective you control.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "celestiteClub",
                        "name": "Celestite Club",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },

                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "kroxigor",
            "name": "Kroxigor",
            "move": "5",
            "control": 2,
            "health": 6,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "brutalBlows",
                    "name": "Brutal Blows",
                    "effect": "This unit's melee weapon have Crit (2 Hits) if the target unit has 5 or more models.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "drakebiteMaul",
                        "name": "Drakebite Maul",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                  
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        
        ]
    },
    {
        "id": factions.luminethRealmLordsGlitteringPhalanx,
        units: [
        {

            "id": "scinariCathallar",
            "name": "Scinari Cathallar",
            "move": "6",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Wizard", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "darknessOfTheSoul",
                    "name": "Darkness of the Soul",
                    "effect": "Pick an enemy unit within 12\" of this unit to be the target then roll a dice.  On a 3+, subtract D6 from the contrl score of the target unit this turn.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "despairingTool",
                        "name": "Despairing Tool",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "D3",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "vanariBladelords",
            "name": "Vanari Bladelords",
            "move": "6",
            "control": 1,
            "health": 2,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "swordmasters",
                    "name": "Swordmasters",
                    "effect": "Each time this unit uses a FIGHT ability, you must pick either the Perfect Strike or Flurry of Blows weapon characteristic for all the attacks it makes with its Sunmetal Greatblade.  In adition, Do not use the attack sequence for an attack made with Perfect Strile.  Instead, roll a dice.  On a 2+, inflict 1 mortal damage on the target unit.",
                    "once": onces.none,
                },
                {
                    "id": "guardians",
                    "name": "Guardians",
                    "effect": "While your general is wholly within this unit's combat range, both this unit and your general has Ward (5+).",
                    "once": onces.none,
                }
            ]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "sunmetalGreatbladePerfectStrike",
                        "name": "Sunmetal Greatblade: Perfect Strile",
                        "range": 0,
                        "attacks": "1",
                        "hit": 0,
                        "wound": 0,
                        "rend": 0,
                        "damage": "0",
                        "ability": "See Ability"
                    },
                    {
                        "id": "sunmetalGreatbladeFlurryOfBlows",
                        "name": "Sunmetal Greatblade: Flurry of Blows",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Crit (Mortal), Anti-Infantry (+1 Rend)"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "vanariAuralanSentiels",
            "name": "Vanari Auralan Sentinels",
            "move": "6",
            "control": 1,
            "health": 1,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "auralanBow",
                        "name": "Auralan Bow",
                        "range": 18,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Crit (Auto-Wound)"
                    }
                ],
                "abilities": [
                    {
                        "id": "loftedShots",
                        "name": "Lofted Shots",
                        "effect": "Unit the end of the phase, add 6\" to the Range characteristic of this unit's Aurain Bows but subtract 1 from hit rolls for this unit's shooting attacks.",
                        "once": onces.none,
                    }
                ]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [                    
                    {
                        "id": "vanariDagger",
                        "name": "Vanari Dagger",
                        "range": 0,
                        "attacks": "1",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "vanariAuralanWardens",
            "name": "Vanari Auralan Wardens",
            "move": "6",
            "control": 1,
            "health": 1,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "wardensPike",
                        "name": "Warden's Pike",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                ],
                "abilities": [
                    {
                        "id": "moonfireFlasks",
                        "name": "Moonfire Flasks",
                        "effect": "Pick an enemy unit in combat with this unit and that charged this turn to be the target, then roll a dice.  On a 2+, inflict D3 mortal damage on that target.",
                        "once": onces.battle,
                    }
                ],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.idonethDeepkinSoulraidHunt,
        units: [
        {

            "id": "isharannSoulscryer",
            "name": "Isharann Soulscryer",
            "move": "6",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "ritualOfTheCreepingMist",
                    "name": "Ritual of the Creeping Mist",
                    "effect": "Pick a visible friendly unit wholly within 12\" of this unit to be the target, then roll a dice.  On a 4+, unit the start of your next turn, the target unit cannot by targeted by shooting attacks unless the attacking model is within its combat range.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "scryfishShoal",
                        "name": "Scryfish Shoul",
                        "range": 10,
                        "attacks": "8",
                        "hit": 5,
                        "wound": 5,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Shoot in Combat, companion"
                    },
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "scryfishShoal",
                        "name": "Scryfish Shoul",
                        "range": 10,
                        "attacks": "8",
                        "hit": 5,
                        "wound": 5,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Shoot in Combat, companion"
                    },
                    {
                        "id": "abyssalTouch",
                        "name": "Abyssal Touch",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "D3",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "akhellianMorrsarrGuard",
            "name": "Akhelian Morrsarr Guard",
            "move": "14",
            "control": 1,
            "health": 4,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Cavalry", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [{
                    "id": "biovoltaicBlast",
                    "name": "Biovoltaic Blast",
                    "effect": "If this unit charged this phase, pick an enemy unit within 1\" of it to be the target, then roll a number of dice equal to the number of models in this unit.  For each 4-5, inflict 1 mortal damage on the target.  For each 6+, inflict D3 mortal damage on the target.  Add 1 to each roll if there are more models in the target unit than this unit.",
                    "once": onces.battle,
                }]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "voltspear",
                        "name": "Voltspear",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "fangmoraFangsAndLashingTail",
                        "name": "Fangmora's Fangs and Lashing Tail",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "D3",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "akhellianAllopex",
            "name": "Akhelian Allopex",
            "move": "12",
            "control": 2,
            "health": 8,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Cavalry", "Fly"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "bloodthirstyPredators",
                    "name": "Blood Thirsty Predators",
                    "effect": "Add 1 to the Attacks characteristic of this unit's Allopex's Frocious Bite if it is within 6\" of any damaged enemy units or if it is within 6\" of any enemy units that have had any models slain in the same turn.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [
                    {
                        "id": "razorshellHarpoonLauncher",
                        "name": "Razorshell Harpoon Launcher",
                        "range": 18,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 2,
                        "rend": 1,
                        "damage": "3",
                        "ability": "Anti-Monster (+1 Rend)"
                    },
                ],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "barbedHooksAndBlades",
                        "name": "Barbed Hooks and Blades",
                        "range": 0,
                        "attacks": "4",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "allopexsFerociousBite",
                        "name": "Allopex's Ferocious Bite",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "2",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "namartiThralls",
            "name": "Namarti Thralls",
            "move": "6",
            "control": 1,
            "health": 1,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": [
                    {
                        "id": "sweepingBlows",
                        "name": "Sweeping Blows",
                        "effect": "Add 1 to the Damage characteristic of this units Lanmari for attacks that target an enemy MONSTER.",
                        "once": onces.none,
                    }
                ]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [
                    {
                        "id": "callForReinforcement",
                        "name": "Call for Reinforcements",
                        "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                        "once": onces.battle,
                    }
                ]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "lanmari",
                        "name": "Lanmari",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 2,
                        "damage": "2",
                        "ability": "Anti-Infantry (+1 Rend)"
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.flesheaterCourtsCarrionRetainers,
        units: [
        {

            "id": "abhorrantArchregent",
            "name": "Abhorrant Archregent",
            "move": "6",
            "control": 2,
            "health": 6,
            "save": 5,
            "ward": 6,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "derangedTransformation",
                    "name": "Deranged Transformation",
                    "effect": "Pick a visible friendly unit wholly within 18\" of this unit to be the target, then make a casting roll of 2D6.  On a 6+, until the start of your next turn, add 2\" to the target's move characteristic and add 1 to wound rolls for its attacks.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "goryTalonsAndFangs",
                        "name": "Gory Talons and Fangs",
                        "range": 0,
                        "attacks": "5",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "cryptGuard",
            "name": "Crypt Guard",
            "move": "6",
            "control": 1,
            "health": 1,
            "save": 6,
            "ward": 5,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements", "Ward(5+)"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "royalBodyguard",
                    "name": "Royal Bodyguard",
                    "effect": "Add 1 ward rolls for friendly HEROs that are wholly within this unit's combat range.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "cursedWeapons",
                        "name": "Cursed Weapons",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "morbhegKnights",
            "name": "Morbheg Knights",
            "move": "12",
            "control": 1,
            "health": 4,
            "save": 4,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": true,
            "keywords": ["Cavalry", "Fly", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "predatorsPounce",
                    "name": "Predator's Pounce",
                    "effect": "This unit can use CHARGE abilities even if it used a RETREAT ability in the same turn.  On addition, no mortal damage is inflicted on this unit when it uses RETREAT abilities.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "grislyLance",
                        "name": "Grisly Lance",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "nightshriekerClawandTooth",
                        "name": "Nightshrieker's Claws and Teeth",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "varghulfCourtier",
            "name": "Varghulf Courtier",
            "move": "10",
            "control": 2,
            "health": 8,
            "save": 5,
            "ward": 6,
            "hero": true,
            "general": false,
            "fly": false,
            "keywords": ["Hero", "Infantry", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "immenseClaws",
                        "name": "Immense Claws",
                        "range": 0,
                        "attacks": "7",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "dagger-likeFangs",
                        "name": "Dagger-like Fangs",
                        "range": 0,
                        "attacks": "1",
                        "hit": 3,
                        "wound": 2,
                        "rend": 2,
                        "damage": "3",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": [{
                    "id": "victoryFeast",
                    "name": "Victory Feast",
                    "effect": "If any models where slain by this unit this turn, Heal (d6) this unit and this unit can immediately use the RETREAT ability without any mortal damage being inflicted on it.",
                    "once": onces.none,
                }]
            }

        },
        ]
    },
    {
        "id": factions.sonsOfBehematWallsmasherStomp,
        units: [
        {

            "id": "mancrusherGargant",
            "name": "Mancrusher Gargant",
            "move": "8",
            "control": 10,
            "health": 12,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Monster", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "timber",
                    "name": "Timber",
                    "effect": "If this model is slain, before removing it from the battlefield. the players must roll off.  The winner picks a point on the battfield up to 3\" from this model.  Inflict D3 mortal damage on each enemy unit within 2\" of that point.  This model is then removed from the battlefield.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [{
                    "id": "throwinRocls",
                    "name": "Throwin' Rocks",
                    "range": 12,
                    "attacks": "1",
                    "hit": 5,
                    "wound": 2,
                    "rend": 2,
                    "damage": "D3",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "massiveClub",
                        "name": "Massive Club",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "eadbutt",
                        "name": "'Eadbutt",
                        "range": 0,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "4",
                        "ability": ""
                    },
                    {
                        "id": "mightyKick",
                        "name": "Mighty Kick",
                        "range": 0,
                        "attacks": "1",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "D3",
                        "ability": ""
                    }
                ],
                "abilities": [{
                    "id": "stuffEmInMeBag",
                    "name": "Stuff'em in Me Bag",
                    "effect": "Pick an enemy unit in combat with this unit to be the target, then roll a dice.  If the roll is at least double the target unit's Health characteristic, 1 model in that unit is slain.",
                    "once": onces.none,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.hedonitesOfSlaaneshBladeOfTheLuridDream,
        units: [
        {

            "id": "shardspeaherOfSlaanish",
            "name": "Shardspeaker of Slaanesh",
            "move": "6",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Wizard", "Infatry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "visionOfDamnation",
                    "name": "Vision of Damnation",
                    "effect": "Make a casting roll of 2D6.  On a 6+, roll 6 dice.  For each 4+, you recieve 1 depravity point.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "hazeStaff",
                        "name": "Haze Staff",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "D3",
                        "ability": ""
                    },
                   
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "slickBladeSeekers",
            "name": "Slickblade Seekers",
            "move": "12",
            "control": 1,
            "health": 4,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Cavalry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "unrivalledVelocity",
                    "name": "Unrivaled Veloctiy",
                    "effect": "You can re-roll charge rolls for this unit.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "slickbladeSeekers",
                        "name": "Slickblade Seekers",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "exaltedSteedsPoisonedTongue",
                        "name": "Exalted Steed's Poisoned Tongue",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": "companion"
                    }
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "slaangorFiendbloods",
            "name": "Slaangor Fiendbloods",
            "move": "6",
            "control": 1,
            "health": 3,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": [{
                    "id": "slaughterAtAnyCost",
                    "name": "Slaughter at any Cost",
                    "effect": "This unit can use this ability if any damage points were allocated to it this turn.  This unit can use the Normal Move ability as if it were your movement phase.",
                    "once": onces.none,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "razorsharpClaws",
                        "name": "Razor-sharp Claws",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "razorSharpAndGildedWeapon",
                        "name": "Razor-sharp Claw and Gilded Weapon",
                        "range": 0,
                        "attacks": "5",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "blissbardArchers",
            "name": "Blissbarb Archers",
            "move": "6",
            "control": 1,
            "health": 1,
            "save": 6,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "lightfootedKillers",
                    "name": "Light-footed Killers",
                    "effect": "This unit can use SHOOT abilities even if it used a RUN ability in the same turn.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "blissbardBow",
                        "name": "Blissbard Bow",
                        "range": 18,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    },
                    {
                        "id": "sybariteBlade",
                        "name": "Sybarite Blade",
                        "range": 0,
                        "attacks": "1",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [{
                    "id": "",
                    "name": "",
                    "effect": "",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.bladesOfKhorneBloodboundGorePilgrims,
        units: [
        {

            "id": "slaughterpriest",
            "name": "Slaughterpriest",
            "move": "5",
            "control": 2,
            "health": 6,
            "save": 5,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Priest", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "bloodBoil",
                    "name": "Blood Boil",
                    "effect": "Pick a visible enemy unit within 16\" of this unit to be the target then make a chanting roll of D6.  On a 4+, inflict D3 mortal damage on the target.",
                    "once": onces.none,
                },
                {
                    "id": "bloodSacrifice",
                    "name": "Blood Sacrifice",
                    "effect": "Pick a friendly unit within this unit's combat range to be the target.  Roll a dice.  On a 2+, inflict D3 mortal damage on the target and you gain 1 blood tithe point.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "hackbladeAndWrathHammer",
                        "name": "Hackblade and Wraith-hammer",
                        "range": 0,
                        "attacks": "4",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "mightSkullcrushers",
            "name": "Mighty Skullcrushers",
            "move": "8",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Cavalry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [{
                    "id": "brassStampede",
                    "name": "Brass Stampede",
                    "effect": "If this unit charged this phase, pick an enemy unit within 1\" of it to be the target, then roll a dice.  On a 2+, inflict 1 mortal damage ont he target.",
                    "once": onces.none,
                }]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "bloodglaive",
                        "name": "Bloodglaive",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "juggernautBrazenHooves",
                        "name": "Juggernaunt's Brazen Hooves",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "D3",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "bloodWarriors",
            "name": "Blood Warriors",
            "move": "5",
            "control": 1,
            "health": 2,
            "save": 3,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "noRespite",
                    "name": "No Respite",
                    "effect": "Each time a model in this unit is slain, you can pick an enemy unit in combat with this unit and roll a dice.  On a 4+, inflict 1 mortal damage on that enemy unit.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "goreaxeAndGorefist",
                        "name": "Goreaxe and Gorefist",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "bloodreavers",
            "name": "Blood Reavers",
            "move": "5",
            "control": 1,
            "health": 1,
            "save": 6,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "reaverBlades",
                        "name": "Reaver Blades",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    },
                    
                ],
                "abilities": [{
                    "id": "",
                    "name": "",
                    "effect": "",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": [
                    {
                        "id": "frenziedDevotion",
                        "name": "Frenzied Devotion",
                        "effect": "If this unit is within 8\" of your general, you can return D3 slain models to this unit.",
                        "once": onces.none,
                    }
                ]
            }

        },
        ]
    },
    {
        "id": factions.ossiarchBonereapersTitheReaperEchelon,
        units: [
        {

            "id": "mortisanSoulreaper",
            "name": "Mortisan Soulreaper",
            "move": "5",
            "control": 2,
            "health": 5,
            "save": 4,
            "ward": 6,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Wizard", "Infantry", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "drainVitality",
                    "name": "Drain Vitality",
                    "effect": "Pick a visible enemy unit within 18\" of this to be the target, then make a casting roll of 2D6.  On a 6+, subtract 1 from hit rolls for attacks made by the target unit until the start of your next turn.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "soulreaperScythe",
                        "name": "Soulreaper Scythe",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 3,
                        "rend": 2,
                        "damage": "2",
                        "ability": ""
                    },
                    
                ],
                "abilities": [{
                    "id": "reknitConstruct",
                    "name": "Reknit Construct",
                    "effect": "Pick a friendly unit wholly within 12\" of this unit and that is not in combat to be the target.  Heal (D3) the target.  If the target until is not damage, you can instead return a number of slain models to it that have combined health characteristic of D3 or less.",
                    "once": onces.none,
                    "tags": ["ossiarchCommand"]
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "mortekGuard",
            "name": "Mortek Guard",
            "move": "4",
            "control": 1,
            "health": 1,
            "save": 4,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Ward (6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "nadiriteAssault",
                    "name": "Nadirite Assault",
                    "effect": "Until the end of the phase, this unit's melee weapon have Crit (2 Hits)",
                    "once": onces.none,
                    "tags": ["ossiarchCommand"],
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "nadiriteSpear",
                        "name": "Nadirite Spear",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": "Anti-charge (+1 Rend)"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "kavalosDeathriders",
            "name": "Kavalos Deathriders",
            "move": "10",
            "control": 1,
            "health": 3,
            "save": 4,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Cavalry", "Ward (6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [
                    {
                        "id": "deathriderWedge",
                        "name": "Deathrider Wedge",
                        "effect": "The following effect apply this phase.  Models i this unit can pass across enemy INFANTRY models as if this unit had FLY.  After this unit has charged, you can pick an enemy unit that it passed across and roll a dice.  On a 2+, inflict D3 mortal damage on that enemy unit.",
                        "once": onces.none,
                        "tags": ["ossiarchCommand"]
                    }
                ]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "nadiriteSpear",
                        "name": "Nadirite Spear",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "kavalosSteedsHoovesAndTeeth",
                        "name": "Kavalos Steed's Hooves and Teeth",
                        "range": 0,
                        "attacks": "2",
                        "hit": 5,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "gothizzarHarvester",
            "name": "Gothizzard Harvester",
            "move": "6",
            "control": 5,
            "health": 10,
            "save": 4,
            "ward": 6,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Monster", "Ward(6+)"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "boneHarvest",
                    "name": "Bone Harvest",
                    "effect": "Each time an enemy model in combat with this unit is slain, thus unit gains 1 bone-tithe point.  It can never have more than 6 bone-tithe points.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "deathsHeadMaw",
                    "name": "Death's Head Maw",
                    "range": 12,
                    "attacks": "4",
                    "hit": 4,
                    "wound": 4,
                    "rend": 1,
                    "damage": "1",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    
                    {
                        "id": "soulcrusherBludgeons",
                        "name": "Soulcrusher Bludgeons",
                        "range": 0,
                        "attacks": "6",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "ossifiedHoovesAndTail",
                        "name": "Ossified Hooves and Tail",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 3,
                        "rend": 2,
                        "damage": "2",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.sylvanethBitterbarkCopse,
        units: [
        {

            "id": "branchwych",
            "name": "Branchwych",
            "move": "6",
            "control": 2,
            "health": 5,
            "save": 5,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Wizard", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "verdurousHarmony",
                    "name": "Verduerous Harmony",
                    "effect": "Pick a visible friendly unit wholly within 18\" of this unit to be the target, then make a casting roll of 2D6.  On a 7+, you can return 1 slain model to the target unit.  If you picked a Tree-Revenants unit, you can return D3 slain models instead of 1.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "greenwoodScytheAndBittergrub",
                        "name": "Greenwood Scythe and Bittergrub",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "D3",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "treelord",
            "name": "Treelord",
            "move": "5",
            "control": 5,
            "health": 14,
            "save": 3,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Monster"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "battleDamaged",
                    "name": "Battle Damaged",
                    "effect": "While this unit has 10 or more damage points, the Attacks characteristic of its Massive Impaling Talons is 1.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "strangleroots",
                    "name": "Strangleroots",
                    "range": 10,
                    "attacks": "3",
                    "hit": 3,
                    "wound": 2,
                    "rend": 1,
                    "damage": "2",
                    "ability": "Shoot in Combat"
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "strangleroots",
                        "name": "Strangleroots",
                        "range": 10,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "sweepingBlows",
                        "name": "Sweeping Bows",
                        "range": 0,
                        "attacks": "5",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "massiveImpalingTalons",
                        "name": "Massive Impaling Talons",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "3",
                        "ability": ""
                    }
                ],
                "abilities": [
                    {
                        "id": "groundshaker",
                        "name": "Groundshaker",
                        "effect": "Pick an enemy unit in combat with this unit to be the target, then roll a dice.  On a 4+, the target has STRIKE-LAST this phase.",
                        "once": onces.none,
                    }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "kurnothHunters",
            "name": "Kurnoth Hunters",
            "move": "5",
            "control": 2,
            "health": 5,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "envoysOfTheEverQueen",
                    "name": "Envoys of the Ever Queen",
                    "effect": "While this unit is contesting an objective, friendly units contesting that objective have Ward (6+).",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "kurnothGreatbow",
                    "name": "Kurnoth Greatbow",
                    "range": 18,
                    "attacks": "2",
                    "hit": 3,
                    "wound": 3,
                    "rend": 1,
                    "damage": "2",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    
                    {
                        "id": "vicioiusClaw",
                        "name": "Vicious Claws",
                        "range": 0,
                        "attacks": "3",
                        "hit": 3,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "treeRevenants",
            "name": "Tree-Revenants",
            "move": "6",
            "control": 1,
            "health": 2,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                }]
            },
            "Shooting": {
                "attacks": [],
                "abilities": [{
                    "id": "martialMemories",
                    "name": "Martial Memories",
                    "effect": "Pick 1 of the following effects to aply to this unit this phase.  Memories of War:  Add 1 to hit rolls for attacks made by this unit.  Memories of Peace: Add 1 to save rolls for this unit.",
                    "once": onces.battle,
                }]
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "enchantedBlade",
                        "name": "Enchanted Blade",
                        "range": 0,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 2,
                        "damage": "2",
                        "ability": ""
                    },
                    
                ],
                "abilities": [{
                    "id": "martialMemories",
                    "name": "Martial Memories",
                    "effect": "Pick 1 of the following effects to aply to this unit this phase.  Memories of War:  Add 1 to hit rolls for attacks made by this unit.  Memories of Peace: Add 1 to save rolls for this unit.",
                    "once": onces.battle,
                }],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.ogorMawTribesTyrantsBellow,
        units: [
        {

            "id": "tyrant",
            "name": "Tyrant",
            "move": "6",
            "control": 5,
            "health": 8,
            "save": 4,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "bullyOfTheFirstDegree",
                    "name": "Bully of the First Degree",
                    "effect": "Pick a friendly unit wholly within 12\" of this unit to be the target.  You cannot pick this unit.  Add 3 to the control score of the target until the start of your next turn.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "ogorPistols",
                    "name": "Ogor Pistols",
                    "range": 10,
                    "attacks": "2",
                    "hit": 4,
                    "wound": 3,
                    "rend": 1,
                    "damage": "D3",
                    "ability": "Shoot in combat"
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "ogorPistols",
                        "name": "Ogor Pistols",
                        "range": 10,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 3,
                        "rend": 1,
                        "damage": "D3",
                        "ability": "Shoot in combat"
                    },
                    {
                        "id": "thundermace",
                        "name": "Thundermace",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 2,
                        "rend": 2,
                        "damage": "3",
                        "ability": ""
                    },
                    {
                        "id": "beastskewerGlaive",
                        "name": "Beastskewer Glaive",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": "Anti-Monster (+1 Rend)"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "ironblaster",
            "name": "Ironblaster",
            "move": "9",
            "control": 2,
            "health": 9,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["War Machine"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "rhinoxCharge",
                    "name": "Rhinox Charge",
                    "effect": "The damage of this unit's Rhinox Sharp Horns is 3 if it charged in the same turn.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "ironblasterCannon",
                    "name": "Ironblaster Cannon",
                    "range": 18,
                    "attacks": "2",
                    "hit": 4,
                    "wound": 2,
                    "rend": 2,
                    "damage": "D3+3",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    
                    {
                        "id": "clubber",
                        "name": "Clubber",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 2,
                        "rend": 0,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "rhinoxSharpHorns",
                        "name": "Rhinox Sharp Horns",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "D3",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "leadbelchers",
            "name": "Leadbelchers",
            "move": "6",
            "control": 2,
            "health": 4,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "firingFromTheBelly",
                    "name": "Firing from the Belly",
                    "effect": "Add 1 to hit rolls for this unit's shooting attacks if it has not used a MOVE ability this turn.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "leadbelcherGun",
                    "name": "Leadbelcher Gun",
                    "range": 15,
                    "attacks": "D3",
                    "hit": 4,
                    "wound": 3,
                    "rend": 1,
                    "damage": "1",
                    "ability": ""
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    
                    {
                        "id": "bludgeoningBlow",
                        "name": "Bludgeoning Blow",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 2,
                        "rend": 0,
                        "damage": "2",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "ogorGluttons",
            "name": "Ogor Gluttons",
            "move": "6",
            "control": 2,
            "health": 4,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "drivenByHunger",
                    "name": "Driven by Hunger",
                    "effect": "Add 1 to charge rolls for this unit.",
                    "once": onces.battle,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "ogorWeapons",
                        "name": "Ogor Weapons",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "mournfangPack",
            "name": "Mournfang Pack",
            "move": "9",
            "control": 2,
            "health": 6,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Cavalry"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "linebreakers",
                    "name": "Linebreakers",
                    "effect": "Subtract 1 from wound rolls for shooting attacks that target this unit.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "cullingClubAndHackers",
                        "name": "Culling Clubs and Hackers",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "mournfangsTusks",
                        "name": "Mournfang's Tusks",
                        "range": 0,
                        "attacks": "4",
                        "hit": 4,
                        "wound": 2,
                        "rend": 1,
                        "damage": "2",
                        "ability": "companion"
                    },
                    
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },
    {
        "id": factions.citiesOfSigmarCasteliteCompany,
        units: [
        {

            "id": "freeguildCavalierMarshal",
            "name": "Freeguild Cavalier-Marshal",
            "move": "10",
            "control": 2,
            "health": 7,
            "save": 3,
            "ward": 0,
            "hero": true,
            "general": true,
            "fly": false,
            "keywords": ["Hero", "Cavalry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": [{
                    "id": "decisiveCommander",
                    "name": "Decisive Commander",
                    "effect": "Pick a friendly Freeguild Steelhelms unit wholly within 12\" of this unit to be the target and roll a dice.  On a 2+, pick 1:  On Your Feet:  If the target unit is not in combat, you can return D3 slain models to it.  Yeild No Quarter:  Add 3 to the target unit's control score until the start of your next turn.",
                    "once": onces.none,
                }]
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "dragoonPistol",
                    "name": "Dargoon Pistol",
                    "range": 10,
                    "attacks": "2",
                    "hit": 3,
                    "wound": 4,
                    "rend": 1,
                    "damage": "1",
                    "ability": "Shoot in Combat"
                },],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "dragoonPistol",
                        "name": "Dargoon Pistol",
                        "range": 10,
                        "attacks": "2",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Shoot in Combat"
                    },
                    {
                        "id": "masterForcedLongsword",
                        "name": "Master-forged Longsword",
                        "range": 0,
                        "attacks": "5",
                        "hit": 3,
                        "wound": 4,
                        "rend": 1,
                        "damage": "2",
                        "ability": ""
                    },
                    {
                        "id": "warhorsesSteelshoedHorse",
                        "name": "Warhorse's Steel-shod Hooves",
                        "range": 0,
                        "attacks": "2",
                        "hit": 5,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "freeguildSteelhelms",
            "name": "Freeguild Steelhelms",
            "move": "5",
            "control": 1,
            "health": 1,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Infantry", "Reinforcements"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": [{
                    "id": "callForReinforcement",
                    "name": "Call for Reinforcements",
                    "effect": "Set up an idenitcal replacement unit on the battlefield, wholly within friendly territory, wholly winith 6\" of the battlefield edge and not in combat.  Each Reinforcement unit can only be replaced once.",
                    "once": onces.battle,
                },
                {
                    "id": "consecrateTheLand",
                    "name": "Consecrate the Land",
                    "effect": "If this unit is contesting an objective you control that is not contested by any enemy models, roll a dice.  On a 3+, that objective is considered by you to be consencrated.  Friendly units have Ward (6+) while they are contesting a consecrated objective.  If you opponent gains control of the consecreated objective, it is no long consecreated.",
                    "once": onces.none,
                }
            ]
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "freeguildWeapons",
                        "name": "Freeguild Weapons",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "freeguildCavaliers",
            "name": "Freeguild Cavaliers",
            "move": "10",
            "control": 1,
            "health": 3,
            "save": 5,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["Cavalry"],
            "Passive": {
                "attacks": [],
                "abilities": []
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": [{
                    "id": "devastatingCharge",
                    "name": "Devastating Charge",
                    "effect": "If this unit charged this phase, pick an enemy unit in combat with it to be the target and roll a dice.  On a 2+, inflict D3 mortal damage on the target.",
                    "once": onces.none,
                }]
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "cavalierWeapon",
                        "name": "Cavalier weapon",
                        "range": 0,
                        "attacks": "3",
                        "hit": 4,
                        "wound": 4,
                        "rend": 1,
                        "damage": "1",
                        "ability": "Charge (+1 Damage)"
                    },
                    {
                        "id": "warhorsesSteelAndHooves",
                        "name": "Warhorse's Steel-shed Hooves",
                        "range": 0,
                        "attacks": "2",
                        "hit": 5,
                        "wound": 3,
                        "rend": 0,
                        "damage": "1",
                        "ability": "companion"
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        {

            "id": "ironweldGreatCannon",
            "name": "Ironweld Great Cannon",
            "move": "3",
            "control": 2,
            "health": 8,
            "save": 4,
            "ward": 0,
            "hero": false,
            "general": false,
            "fly": false,
            "keywords": ["War Machine"],
            "Passive": {
                "attacks": [],
                "abilities": [{
                    "id": "shotAndSteel",
                    "name": "Shot and Steel",
                    "effect": "Each time this unit uses a SHOOT ability, choose either the Cannonball or Grapeshot weapon characteristic for all the attacks it makes with its Great Cannon.  The Cannonball can only be choosen if this unit has no used a MOVE ability this turn.",
                    "once": onces.none,
                }]
            },
            "Start":
            {
                "attacks": [],
                "abilities": []
            },
            "Hero": {
                "attacks": [],
                "abilities": []
            },
            "Movement": {
                "attacks": [],
                "abilities": []
            },
            "Shooting": {
                "attacks": [{
                    "id": "greatCannonCannonball",
                    "name": "Great Cannon: Cannonball",
                    "range": 24,
                    "attacks": "2",
                    "hit": 4,
                    "wound": 2,
                    "rend": 2,
                    "damage": "D3+2",
                    "ability": ""
                },
                {
                    "id": "greatCannonGrapeshot",
                    "name": "Great Cannon: Grapeshot",
                    "range": 12,
                    "attacks": "5",
                    "hit": 3,
                    "wound": 3,
                    "rend": 1,
                    "damage": "2",
                    "ability": ""
                }],
                "abilities": []
            },
            "Charge": {
                "attacks": [],
                "abilities": []
            },
            "Combat":
            {
                "attacks": [
                    {
                        "id": "crewsToolsAndSidearms",
                        "name": "Crew's Tools and Sidearms",
                        "range": 0,
                        "attacks": "2",
                        "hit": 4,
                        "wound": 4,
                        "rend": 0,
                        "damage": "1",
                        "ability": ""
                    }
                ],
                "abilities": [],
            },
            "End": {
                "attacks": [],
                "abilities": []
            }

        },
        ]
    },


    ]
}

