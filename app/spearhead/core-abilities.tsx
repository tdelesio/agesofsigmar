import { onces } from "./factions";
import { phases } from "./phase";

export const Alliances = {
    "coreabilities": [
        {
            "phase": phases.start,
            "flow": [
                "First battle round:  Attacker chooses who take first turn.  Later battle rounds: players make a priority roll.",
                "Determine Underdog",
                "Draw Twist Cards",
                "The players draw battle tatic cards",
                "Start of Round Abilities are used."
            ],
            "abilities": [
                
            ]
        },
        {
            "phase": phases.movement,
            "abilities": [
                {
                    "id": "normalMove",
                    "name": "Norma Move",
                    "effect": "Pick a friendly unit that is not in combat.  This unit can move up to the distance This unit cannot move into combat during any part of this move.",
                    "once": onces.none,
                },
                {
                    "id": "run",
                    "name": "Run",
                    "effect": "Pick a friendly unit that is not in combat.  Make a run roll of D6.  That unit can move a distance up to its move characteroristic added to the run roll.  That unit cannot move into combat during any part of its move.",
                    "once": onces.none,
                },
                {
                    "id": "retreat",
                    "name": "Retreat",
                    "effect": "Pick a friendly unit that is in combat.  Inflict D3 mortal damage on that unit.  The unit can move a distance up to its Move Characteroristic.  The unit can move through the combat ranges of amy enemy units but cannot end that move within any enemey units combat range.",
                    "once": onces.none,
                },
                {
                    "id": "callForReinforcements",
                    "name": "Call for Reinforcements",
                    "effect": "Set up identical replacement unit on the battlefield, wholly within friendly territory, wholly within 6\" of the battlefield edge and not in combat.  Each reinforcement can only be replaced once.  Replacement units cannot themselves be replaced.",
                    "once": onces.none,
                }

            ]
        },
        {
            "phase": phases.charge,
            "abilities": [
                {
                    "id": "charge",
                    "name": "Charge",
                    "effect": "Pick a friendly unit that has not used a RUN or CHARGE ability this turn to use this ability.  Then make a 2D6 charge roll.  That unit can move the distance up to the value of the charge roll.  The unit can move through combat ranges of enenmy units and must end that move within 1\/2\" of an enemy unit.  If it does so, the unit using this ability has charged.",
                    "once": onces.none,
                }
            ]
        },
        {
            "phase": phases.shooting,
            "abilities": [
                {
                    "id": "shoot",
                    "name": "Shoot",
                    "effect": "Pick a friendly unit that has not used a RUN or CHARGE ability this turn to use this ability.  Then pick one or more enemy units as the target of the unit's attack.  Resolve Shooting attacks against the targeted units.",
                    "once": onces.none,
                },
                {
                    "id": "guardedHero",
                    "name": "Guarded Hero",
                    "effect": "If ths HERO is within the combat range of a friendly unit that is not a HERO:  Subtract 1 from hit rolls for shooting attacks that target this HERO.  If this HERO is INFANTRY, they cannot be picked as the target of shooting attacks made by unit more than 12\" from from them.",
                }
            ]
        },
        {
            "phase": phases.combat,
            "abilities": [
                {
                    "id": "fight",
                    "name": "Fight",
                    "effect": "Pick a friendly unit that is in combat or that charged this turn to use this ability.  That unit can make a pile-in move.  Then if that unit is in combat, you must pick one or more enemy units as targets of that unit's attacks.  Resolve combat attacks against the target unit(s).",
                    "once": onces.none,
                }
            ]
        },
        {
            "phase": phases.end,
            "flow": [
                    "Score 1 Victory point if you control at least 1 objective",
                    "Score 1 Victory Point if you control 2 or more objectives",
                    "Score 1 Victory point if you contorl more objectives than your opponent.",
                    "Score 1 Victory Point for each Battle Tactic you completed"
                
            ],
            "abilities": [
               
            ]
        },
        {
            "phase": phases.any,
            "flow": [
                "Large Terrain Feature:  Cover, Obscuring, Unstable",
                "Small Terrain Feature:  Cover, Unstable",
                "Cover:  Subtract 1 from HIT rolls for attacks that target a unit that is behind or wholly on this terrain feature unless that unit charged or has the FLY keyword.",
                "Obscuring:  A unit cannot be targeted by shooting attacks if it is behind or wholly on this terrain feature, unless has the FLY keyword",
                "Unstable: Models can move across but cannot be set up on or end any type of move on anty part of this terrain feature that is more than 1\" tall."

            ]


        }
    ]
}

