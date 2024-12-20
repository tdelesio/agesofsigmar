import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { factions } from '@/app/shared/factions';

interface AbilityTableProps {
  passedFaction: number;
  description: string;
}

export type BattleTraitTable ={
  faction: number;
  columnOneLabel: string;
  columnTwoLabel: string;
  labels: string[];
  abilities: string[];
}

export const battleTraitTable = {
  "factions": [
    {
      "faction": factions.slaveToDarknessBloodWindLegion,
    "columnOneLabel": "D6",
    "columnTwoLabel": "Ability",
    "labels": ["1", "2", "3", "4", "5", "6"],
    "abilities": [
      "Snubbed by the Gods: No effect.",
      "Ward of Tzeentch.  This unit has Ward (6+).",
      "Grace of Slaanesh.  Add 1 to the run rolls for this unit.",
      "Blessing of Nurgle.  Subtract 1 from wound rolls for attacks that target this unit.",
      "Fury of Khorne.  Add 1 to the Rend of this unit's melee weapon.",
      "Champion of Chaos.  Pick any abililty from the table."
    ]
  },
  {
    "faction": factions.daughtersOfKhaineHeartflayerTroupe,
    "columnOneLabel": "Round",
    "columnTwoLabel": "Ability",
    "labels": ["1", "2", "3", "4"],
    "abilities": [
      "Add 1 to run for this unit.",
      "Add 1 to the Charge roll for this unit.",
      "Add 1 to the hit rolls for combat attacks made by this unit.",
      "Add 1 to wound rolls for combat attacks made by this unit."
    ]
  },
  {
    "faction": factions.gloomspiteGitzBadMoonMadmob,
    "columnOneLabel": "Ability",
    "columnTwoLabel": "Effect",
    "labels": ["Frothing Zealots", "Lunar Squids", "Moonlite Hide"],
    "abilities": [
      "If the unit is a Moonclan Stabbas unit, add 3 to its contorl score.",
      "If the unit is a Squiq Hooper unit, no mortal damaage is inflicted when it uses its retreat ability.",
      "If the unit is a Rockgut Troggoths unit, add 1 to save rolls for attacks that target this unit.",
    ]
  },
  {
    "faction": factions.fyreslayersSageAxeband,
    "columnOneLabel": "Standard",
    "columnTwoLabel": "Enhanced",
    "labels": ["Rune of Fury: Add 1 to hit rolls to all attacks made by this unit's melee weapon.", "Rune of Searing Heat: Add 1 to Rend characteristic of your unit's melee weapons.", "Rune of Fiery Determination: Your units have Ward(5).", "Rune of Relentless Zeal: Add 2\" to you move."],
    "abilities": [
      "In addition, add 1 to your Attack characteristic for this unit's melee weapon.",
      "In addition, add 1 to the Damage characteristic for this unit's melee weapon.",
      "In addition, add 1 to save rolls for this unit.",
      "In addition, add 2 to charge rolls for this unit."
    ]
  },
  {
    "faction": factions.idonethDeepkinSoulraidHunt,
    "columnOneLabel": "Round",
    "columnTwoLabel": "Ability",
    "labels": ["1", "2", "3", "4"],
    "abilities": [
      "Low Tide: Subtract 1 from hit rolls for shooting attacks that target this unit.",
      "Flood Tide: Ths unit can use a RUN ability and still use SHOOT and/or CHARGE abilities later in the turn.",
      "High Tide: This unit as STRIKE-FIRST",
      "EBB Tide: This unit can use a RETREAT ability and still use a SHOOT and/or CHARGE abilities later in this turn."

    ]
  },
  {
    "faction": factions.hedonitesOfSlaaneshBladeOfTheLuridDream,
    "columnOneLabel": "Depravity Points",
    "columnTwoLabel": "Ability",
    "labels": ["12+", "24+", "36+"],
    "abilities": [
      "Tantalising Torment:  This unit can use a RUN ability and still use CHARGE abilities later in the turn.",
      "Sadistic Spite: This unit's melee weapons have Crit (Mortal) ",
      "Oblivious Indulgence: This unit has Ward (5+)",

    ]
  }
]

}


export function AbilityTable({ passedFaction, description }: AbilityTableProps) {


  const battleTrait = battleTraitTable.factions.find(trait => trait.faction === passedFaction);

  return (


  
      

    <Card
    key=""
    className="relative overflow-hidden transition-all duration-300 ease-in-out mx-auto w-full overflow-hidden">

<CardHeader>
          <CardTitle>Battle Trait </CardTitle><p>{description}</p>
        </CardHeader>
        <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="">{battleTrait?.columnOneLabel}</TableHead>
          <TableHead>{battleTrait?.columnTwoLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
      {battleTrait?.abilities.map((ability, index) => (
    
          <TableRow key={index}>
            <TableCell className="font-medium">{battleTrait?.labels[index]}</TableCell>
            <TableCell>{ability}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </CardContent>

    </Card>
  )
}