"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";



// Importing app.css is css file to add styling
//import "./App.css";
export type Deck = {
    cards: BattleTacticCard[];
}

export type BattleTacticCard = {
    id: string;
    name: string;
    battleTacticObjective: string;
    command: Commmand;
}

export type Commmand = {
    name: string;
    usedBy: string;
    effect: string;
    phase: string;
}


export const Deck = {
    "cards": [
        {
            "id": "behematDais",
            "name": "The Behemat Dais",
            "battleTacticObjective": "You complete this battle tactic if you control the Behemat objective (SKULL) at the end of your turns",
            "command": {
                "name": "Scroll of Arcane Bolt",
                "usedBy": "Pick a friendly Hero to use this ability, pick a visbile enemy unit within 12\" of the them, then roll a dice.",
                "effect": "On a 2+, inflict D3 mortal damage on the enemy unit.",
                "phase": "hero",
            }
        },
        {
            "id": "raid",
            "name": "Raid",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if any friendly units are wholly within enemey territory and not in combat.",
            "command": {
                "name": "Steel Defence",
                "usedBy": "A friendly unit target by that Attack ability.",
                "effect": "Ignore the Rend characterstic of attacks that target that unit this phase.",
                "phase": "combat",
            }
        },
        {
            "id": "bracothionDias",
            "name": "The Dracothion Dais",
            "battleTacticObjective": "You complete this battle tactic if you control the Dracothion objective (HORNS) at the end of your turn.",
            "command": {
                "name": "Go To Ground",
                "usedBy": "A friendly unit targeted by that Shoot Ability",
                "effect": "Unit the end of the phase, only unmodified hit rolls of 6 successfully hit for attacks that target that unit.  However that unit has Strike-Last this turn.",
                "phase": "shoot",
            }
        },
        {
            "id": "warOfAttrition",
            "name": "War Of Attrition",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if any enemy units were destroyed AND more enemy units than friendlys units were destroyed this turn.",
            "command": {
                "name": "Stand Guard",
                "usedBy": "Pick a friendly unit to use this ability.",
                "effect": "That unit has Strike-First this turn.",
                "phase": "hero",
            }
        },
        {
            "id": "takeWithoutWarning",
            "name": "Take Without Warning",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if you gain control of an objective that was controlled by your opponent at the start of the turn AND none of the units contesting that objective used a Fight Ability this turn.",
            "command": {
                "name": "Fight to the Last",
                "usedBy": "A friendly unit targeted by that Attack Ability.",
                "effect": "That unit has Ward (5+) this phase.",
                "phase": "combat"
            }
        },
        {
            "id": "takeTheFlanks",
            "name": "Take the Flanks",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if there are any friendly units within 3\" of each short battlefield edge.",
            "command": {
                "name": "Redploy",
                "usedBy": "Pick a friendly unit that is not in combat to use this ability.",
                "effect": "That unit can move up to D6\".  That unit cannot move into combat during any part of that move.",
                "phase": "combat"
            }
        },
        {
            "id": "raze",
            "name": "Raze",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if there are any friendly units within 3\" of the long battlefield edge in the enemy territory.",
            "command": {
                "name": "Inspiring Presence",
                "usedBy": "Pick a friendly Hero to use this ability.",
                "effect": "Roll a dice.  For the rest of the turn, add the number rolled to the control score of that Hero.",
                "phase": "hero"
            }
        },
        {
            "id": "cutOffTheHead",
            "name": "Cut Off the Head",
            "battleTacticObjective": "You complete the battle tactic at the end of your turn if the enemy general was slain this turn OR the enemy general was slain in an earlier turn AND any enemy units were destroyed this turn.",
            "command": {
                "name": "Counter Charge",
                "usedBy": "Pick a friendly unit that is not in combat to use this ability.",
                "effect": "That unit can use a Charge ability as if it were the charge phase.",
                "phase": "charge"
            }
        },
        {
            "id": "doNotWaiver",
            "name": "Do Not Waiver",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if any friendly units used a Fight ability this turn AND no friendly units were destroyed this turn.",
            "command": {
                "name": "Fall Back and Rally",
                "usedBy": "The unit using the retreat ability.",
                "effect": "No mortal damage is inflicted on that unit by the Retreat ability.  In addition, after the ability is resolved, roll 1 dice for each slain model from that unit.  For each 5+, you can turn 1 slain model to that unit.",
                "phase": "movement"
            }
        },
        {
            "id": "holdGround",
            "name": "Hold Ground",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if there are more friendly models contesting the large terrain feature in your territory than there are enemy models contesting it.",
            "command": {
                "name": "Rise to the Challenge",
                "usedBy": "Pick a friendly Hero to use this ability.",
                "effect": "Heal (D6) that Hero.",
                "phase": "combat",
            }
        },
        {
            "id": "attackOnTwoFronts",
            "name": "Attack on Two Fronts",
            "battleTacticObjective": "You complete this battle tactic at the end of your turn if you control 2 objectives that were controlled by your opponent at the start of the turn.",
            "command": {
                "name": "Call Reinforcements",
                "usedBy": "Pick a friendly Infantry or Cavalry unit with 5 or more models that has been destroyed and has not already been replaced.",
                "effect": "Set up a replacement unit consisting of D3 models from that unit anywhere on the battlefield more than 6\" from all enemy units.",
                "phase": "movement",
            }
        },
        {
            "id": "ignaxDias",
            "name": "The Ignax Dias",
            "battleTacticObjective": "You complete this battle tactic if you control the Ignax objective (DRAGON) at the end of your turn.",
            "command": {
                "name": "Forward to Victory",
                "usedBy": "The unit using the Charge abillity.",
                "effect": "You can re-roll the charge roll.",
                "phase": "charge"
            }
        }
    ]
}