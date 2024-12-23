import { onces } from "./factions";

export interface Ability {
    id: string;
    name: string;
    effect: string;
    once: typeof onces[keyof typeof onces];
  }
  
  export interface Phase {
    [key: string]: Ability[];
  }
  
  export interface CoreAbilities {
    phases: Phase[];
  }

  export const CoreAbilities: CoreAbilities = {
    "phases": [
      { "start": [
        {
            "id": "guardedHero",
            "name": "Guarded Hero",
            "effect": "If ths HERO is within the combat range of a friendly unit that is not a HERO:  Subtract 1 from hit rolls for shooting attacks that target this HERO.  If this HERO is INFANTRY, they cannot be picked as the target of shooting attacks made by unit more than 12\" from from them.",
            "once": onces.none,
        }
      ] },
      { "hero": [] },
      {
        "movement": [
          {
            "id": "callForReinforcements",
            "name": "Call for Reinforcements",
            "effect": "Pick a friendly REINFORCEMENT unit that has not been destroyed. Set up an identical replacement unit on the battlefield wholly within friendly territory, wholly within 6\" of the battlefield edge and not in combat.",
            "once": onces.none,
          },
          {
            "id": "normalMove",
            "name": "Normal Move",
            "effect": "Pick a friendly unit that is not in combat. This unit can move a distance up to its move characteristic. The unit cannot move into combat during any part of the move.",
            "once": onces.none,
          },
          {
            "id": "run",
            "name": "Run",
            "effect": "Pick a friendly unit that is not in combat. Make a run roll of D6. That unit can move a distance up to its Move characteristic added to the run roll. That unit cannot move into combat during any part of that move.",
            "once": onces.none,
          },
          {
            "id": "retreat",
            "name": "Retreat",
            "effect": "Pick a friendly unit that is in combat to use this ability. Inflict D3 mortal damage on that unit. That unit can move a distance up to its Move. That unit can move through the combat ranges of any enemy units but cannot end that move within an enemy's combat range.",
            "once": onces.none,
          }
        ]
      },
      {
        "shooting": [
          {
            "id": "shoot",
            "name": "Shoot",
            "effect": "Pick a friendly unit that has not used a Run or Retreat ability this turn to use this ability. Then pick one or more enemy units as the target of that unit's attacks. Resolve shooting attacks against the target unit.",
            "once": onces.none,
          },
          {
            "id": "guardedHero",
            "name": "Guarded Hero",
            "effect": "If ths HERO is within the combat range of a friendly unit that is not a HERO:  Subtract 1 from hit rolls for shooting attacks that target this HERO.  If this HERO is INFANTRY, they cannot be picked as the target of shooting attacks made by unit more than 12\" from from them.",
            "once": onces.none,
        }
        ]
      },
      {
        "charge": [
          {
            "id": "charge",
            "name": "Charge",
            "effect": "Pick a friendly unit that is not in combat and has not used a Run or Retreat ability this turn to use this ability. Then make a charge roll of 2D6. That unit can move a distance up to the value of the charge roll. That unit can move through the combat ranges of any enemy units and must end that move within 1/2\" of a visible enemy unit. If it does so, that unit using this ability has charged.",
            "once": onces.none,
          }
        ]
      },
      {
        "combat": [
            {
                "id": "guardedHero",
                "name": "Guarded Hero",
                "effect": "If ths HERO is within the combat range of a friendly unit that is not a HERO:  Subtract 1 from hit rolls for shooting attacks that target this HERO.  If this HERO is INFANTRY, they cannot be picked as the target of shooting attacks made by unit more than 12\" from from them.",
                "once": onces.none,
            },
            {
                "id": "fight",
                "name": "Fight",
                "effect": "Pick a friendly unit that is in combat or that charged this turn to use this ability.  That unit can make a pile-in move.  Then if that unit is in combat, you must pick one or more enemy units as targets of that unit's attacks.  Resolve combat attacks against the target unit(s).",
                "once": onces.none,
            }
        ]
      },
      {
        "end": [
            {
                "id": "score",
                "name": "Score",
                "effect": "Score 1 Victory point if you control at least 1 objective.  Score 1 Victory Point if you control 2 or more objectives.  Score 1 Victory point if you contorl more objectives than your opponent.  Score 1 Victory Point for each Battle Tactic you completed.",
                "once": onces.none,
            }
        ]
      }
    ]
  };