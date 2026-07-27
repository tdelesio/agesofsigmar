import { Faction } from '../types';

export const DEFAULT_FACTIONS: Faction[] = [
  {
    id: 'ogor-mawtribes',
    name: 'Ogor Mawtribes',
    spearheadName: 'Warglutt Marauders',
    battleTraits: [
      {
        id: 'feastOnFlesh',
        name: 'Feast on Flesh',
        effect: 'In the combat phase, after an Ogor unit fights, you can heal up to D3 wounds on that unit. If it is already at full health, roll a D6. On a 2+, inflict 1 mortal damage on an enemy unit in combat with it.',
        phase: 'combat',
        timing: 'Combat Phase, after fighting',
        once: 'once-per-turn'
      },
      {
        id: 'ravenousBrutes',
        name: 'Ravenous Brutes',
        effect: 'Add 2 to Run rolls for friendly Ogor units, as long as the Feast on Flesh battle trait has not been used yet this round.',
        phase: 'passive',
        timing: 'Passive (Movement Phase)',
        once: 'none'
      },
      {
        id: 'tramplingCharge',
        name: 'Trampling Charge',
        effect: 'After a friendly Ogor unit charges, roll a D6 for each enemy unit within 1". On a 2+, inflict D3 mortal damage on that enemy unit.',
        phase: 'charge',
        timing: 'Charge Phase, after charging',
        once: 'none'
      }
    ],
    regimentAbilities: [
      {
        id: 'mightMakesRight',
        name: 'Might Makes Right',
        effect: 'For objective control purposes, each friendly Ogor model counts as 2 models (and friendly Ogor HEROES count as 5 models).',
        phase: 'passive',
        timing: 'Passive (End of Turn Scoring)',
        once: 'none'
      }
    ],
    enhancements: [
      {
        id: 'gruesomeTrophyRack',
        name: 'Gruesome Trophy Rack',
        effect: 'Add 1 to hit rolls for melee attacks made by your General (Tyrant) and any friendly Ogor units wholly within 12" of them.',
        phase: 'combat',
        timing: 'Combat Phase, when attacking',
        once: 'none'
      },
      {
        id: 'bullyOfTheFirstDegree',
        name: 'Bully of the First Degree',
        effect: 'In your hero phase, pick a friendly Ogor unit within 12" of your general. Add 3 to that unit\'s control score until your next turn.',
        phase: 'hero',
        timing: 'Your Hero Phase',
        once: 'once-per-turn'
      }
    ],
    units: [
      {
        id: 'tyrant',
        name: 'Tyrant',
        move: 6,
        control: 2,
        health: 8,
        models: 1,
        save: 4,
        ward: 0,
        isHero: true,
        weapons: [
          {
            name: 'Beastslayer Club',
            range: 'Melee',
            attacks: '6',
            hit: 3,
            wound: 3,
            rend: 1,
            damage: '2',
            abilities: 'Crit (Mortal)'
          }
        ],
        abilities: [
          {
            id: 'killerReputation',
            name: 'Killer Reputation',
            effect: 'Subtract 1 from control scores of enemy units within 6" of this unit.',
            phase: 'passive',
            timing: 'Passive',
            once: 'none'
          }
        ]
      },
      {
        id: 'ogorGluttons',
        name: 'Ogor Gluttons',
        move: 6,
        control: 2,
        health: 4,
        models: 4,
        save: 5,
        ward: 0,
        isHero: false,
        weapons: [
          {
            name: 'Clubs and Blades',
            range: 'Melee',
            attacks: '4',
            hit: 3,
            wound: 3,
            rend: 0,
            damage: '1'
          }
        ],
        abilities: [
          {
            id: 'drivenByHunger',
            name: 'Driven by Hunger',
            effect: 'Add 1 to Charge rolls for this unit.',
            phase: 'charge',
            timing: 'Charge Phase',
            once: 'none'
          }
        ]
      },
      {
        id: 'ironguts',
        name: 'Ironguts',
        move: 6,
        control: 1,
        health: 4,
        models: 4,
        save: 4,
        ward: 0,
        isHero: false,
        weapons: [
          {
            name: 'Mighty Great-weapons',
            range: 'Melee',
            attacks: '3',
            hit: 3,
            wound: 3,
            rend: 1,
            damage: '2'
          }
        ],
        abilities: [
          {
            id: 'downToEarthBrutality',
            name: 'Down-to-earth Brutality',
            effect: 'Once per battle, in the combat phase, this unit can fight twice (it must be selected to fight twice, alternating as normal).',
            phase: 'combat',
            timing: 'Combat Phase, when selected to fight',
            once: 'once-per-battle'
          }
        ]
      },
      {
        id: 'leadbelchers',
        name: 'Leadbelchers',
        move: 6,
        control: 1,
        health: 4,
        models: 4,
        save: 5,
        ward: 0,
        isHero: false,
        weapons: [
          {
            name: 'Leadbelcher Gun',
            range: '12"',
            attacks: 'D6',
            hit: 4,
            wound: 3,
            rend: 1,
            damage: '1'
          },
          {
            name: 'Fists and Clubs',
            range: 'Melee',
            attacks: '3',
            hit: 4,
            wound: 3,
            rend: 0,
            damage: '1'
          }
        ],
        abilities: [
          {
            id: 'thunderousShots',
            name: 'Thunderous Shots',
            effect: 'If this unit has not moved this turn, add 1 to the Attacks characteristic of its Leadbelcher Guns.',
            phase: 'shooting',
            timing: 'Your Shooting Phase',
            once: 'none'
          }
        ]
      }
    ]
  },
  {
    id: 'stormcast-eternals',
    name: 'Stormcast Eternals',
    spearheadName: 'Vanguard Wing',
    battleTraits: [
      {
        id: 'shieldOfAzyr',
        name: 'Shield of Azyr',
        effect: 'Pick a friendly Stormcast unit. Until the start of your next turn, that unit has Ward 5+.',
        phase: 'hero',
        timing: 'Your Hero Phase',
        once: 'once-per-turn'
      },
      {
        id: 'stormCharge',
        name: 'Storm Charge',
        effect: 'Pick a friendly Stormcast unit not in combat. That unit can charge this turn even if it ran in the movement phase.',
        phase: 'charge',
        timing: 'Your Charge Phase',
        once: 'once-per-turn'
      }
    ],
    regimentAbilities: [
      {
        id: 'strikeWhereNeeded',
        name: 'Strike Where Needed',
        effect: 'Once per battle, a friendly Stormcast unit can retreat for free in the movement phase (no mortal damage taken, and can still charge).',
        phase: 'movement',
        timing: 'Your Movement Phase',
        once: 'once-per-battle'
      },
      {
        id: 'blazeOfGlory',
        name: 'Blaze of Glory',
        effect: 'In combat, each time a friendly Stormcast model is slain, roll a D6. On a 4+, inflict 1 mortal damage on the enemy unit that slew them.',
        phase: 'combat',
        timing: 'Combat Phase, when models are slain',
        once: 'none'
      }
    ],
    enhancements: [
      {
        id: 'hallowedScrolls',
        name: 'Hallowed Scrolls',
        effect: 'Your general has Ward 5+ at all times.',
        phase: 'passive',
        timing: 'Passive',
        once: 'none'
      },
      {
        id: 'quickSilverDraught',
        name: 'Quicksilver Draught',
        effect: 'Once per battle, in the combat phase, your general gains the Strike-First effect.',
        phase: 'combat',
        timing: 'Combat Phase, when starting combat',
        once: 'once-per-battle'
      }
    ],
    units: [
      {
        id: 'lordVigilant',
        name: 'Lord Vigilant',
        move: 12,
        control: 2,
        health: 8,
        models: 1,
        save: 3,
        ward: 0,
        isHero: true,
        weapons: [
          {
            name: 'Hallowed Greataxe',
            range: 'Melee',
            attacks: '5',
            hit: 3,
            wound: 3,
            rend: 1,
            damage: '2'
          }
        ],
        abilities: [
          {
            id: 'planTheAttack',
            name: 'Plan the Attack',
            effect: 'Once per battle, pick a friendly unit within 6" of this unit. That unit can make a free attack this phase.',
            phase: 'hero',
            timing: 'Your Hero Phase',
            once: 'once-per-battle'
          }
        ]
      },
      {
        id: 'liberators',
        name: 'Liberators',
        move: 5,
        control: 1,
        health: 2,
        models: 5,
        save: 3,
        ward: 0,
        isHero: false,
        weapons: [
          {
            name: 'Storm Warhammer',
            range: 'Melee',
            attacks: '3',
            hit: 3,
            wound: 4,
            rend: 0,
            damage: '1'
          }
        ],
        abilities: [
          {
            id: 'layDownTheirLives',
            name: 'Lay Down Their Lives',
            effect: 'Add 1 to save rolls for this unit while contesting an objective you control.',
            phase: 'passive',
            timing: 'Passive',
            once: 'none'
          }
        ]
      }
    ]
  },
  {
    id: 'skaven',
    name: 'Skaven',
    spearheadName: 'Gnawfeast Clawpack',
    battleTraits: [
      {
        id: 'lurkingVermintide',
        name: 'The Lurking Vermintide',
        effect: 'Pick an undeployed Skaven unit and place it in the tunnels below. In your movement phase, deploy it wholly within 6" of any battlefield corner, more than 9" from all enemy units.',
        phase: 'movement',
        timing: 'Your Movement Phase',
        once: 'once-per-battle'
      }
    ],
    regimentAbilities: [
      {
        id: 'warpstoneLacedBullets',
        name: 'Warpstone Laced Bullets',
        effect: 'In your shooting phase, pick a friendly unit. Ranged weapons for that unit have Crit (Mortal) this turn.',
        phase: 'shooting',
        timing: 'Your Shooting Phase',
        once: 'once-per-turn'
      },
      {
        id: 'tooQuickToHit',
        name: 'Too Quick to Hit',
        effect: 'Subtract 1 from hit rolls for attacks targeting friendly Skaven units that retreated this turn.',
        phase: 'passive',
        timing: 'Passive',
        once: 'none'
      }
    ],
    enhancements: [
      {
        id: 'cloakOfStitchedVictories',
        name: 'Cloak of Stitched Victories',
        effect: 'Your general has Ward 5+.',
        phase: 'passive',
        timing: 'Passive',
        once: 'none'
      },
      {
        id: 'warpstoneCharm',
        name: 'Warpstone Charm',
        effect: 'Subtract 1 from save rolls for enemy units in combat with your general.',
        phase: 'passive',
        timing: 'Passive',
        once: 'none'
      }
    ],
    units: [
      {
        id: 'clawlord',
        name: 'Clawlord on Gnaw-beast',
        move: 8,
        control: 2,
        health: 7,
        models: 1,
        save: 4,
        ward: 0,
        isHero: true,
        weapons: [
          {
            name: 'Warpstone-tipped Glaive',
            range: 'Melee',
            attacks: '5',
            hit: 3,
            wound: 3,
            rend: 1,
            damage: '2'
          }
        ],
        abilities: [
          {
            id: 'verminrage',
            name: 'Verminrage',
            effect: 'Add 1 to Attacks for friendly Clanrats units wholly within 13" of this unit.',
            phase: 'passive',
            timing: 'Passive',
            once: 'none'
          }
        ]
      },
      {
        id: 'clanrats',
        name: 'Clanrats',
        move: 6,
        control: 1,
        health: 1,
        models: 20,
        save: 5,
        ward: 0,
        isHero: false,
        weapons: [
          {
            name: 'Rusty Blades',
            range: 'Melee',
            attacks: '2',
            hit: 4,
            wound: 4,
            rend: 0,
            damage: '1'
          }
        ],
        abilities: [
          {
            id: 'clawingReinforcements',
            name: 'Call for Reinforcements',
            effect: 'Once per battle, when this unit is destroyed, you can replace it in reserve at half strength.',
            phase: 'end',
            timing: 'End of Turn',
            once: 'once-per-battle'
          }
        ]
      }
    ]
  }
];
