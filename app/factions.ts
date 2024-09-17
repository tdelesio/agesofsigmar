

export type Alliance = {
    id: string;
    name: string;
    factions: NVP[];
}

export type NVP = {
    id: string;
    name: string;
}

export type Faction = {
    id: string;
    name: string;
    battleTraits: BattleTrait[];
    regimentAbilities: RegimentAbilitiy[];
    enhancements: Enhancement[];
    units: string[];
  }
  
  export type BattleTrait = {
    id: string;
    name: string;
    effect: string;
    once: boolean;
    phase: string;
    table: boolean;
  }
  
  export type RegimentAbilitiy = {
    id: string;
    name: string;
    effect: string;
    once: boolean;
    phase: string;
  }

  export type Enhancement = {
    id: string;
    name: string;
    effect: string;
    once: boolean;
    phase: string;
  }
export const Alliances = {
    "alliances": [
        {
            "id": "order",
            "name": "Order",
            "factions": [
                {
                    "id" : "stormcast1",
                    "name": "Stormcast Eternals - Vigilant Brotherhood"
                 },
                 { 
                    "id": "stormcast2", 
                    "name": "Stormcast Eternals - Yndrastra's Spearhead"
                 },
                 {
                    "id": "DoK",
                    "name": "Daughters of Khaine"
                  },
                  {
                    "id": "fyreslayers",
                    "name": "Fyreslayers"
                  },
                ]
        },
        {
            "id": "death",
            "name": "Death",
            "factions": [
                {
                    "id": "nighthaunt",
                    "name": "Nighthaunt"
                 },
                 {
                    "id": "soulblight",
                    "name": "Soulblight Gravelords"
                 },
                ]
        },
        {
            "id": "chaos",
            "name": "Chaos",
            "factions": [
                {
                    "id": "skaven1",
                    "name": "Skaven - Gnawfeast Clawpack",
                 },
                 {
                    "id": "skaven2",
                    "name": "Skaven - Warpspark Clawpack",
                 },
                 {
                    "id": "SoD",
                    "name": "Slaves of Darkness",
                 },
            ]
        },
        {
            "id": "destruction",
            "name": "Destruction",
            "factions": [
                {
                    "id": "gloomspiteGitz",
                    "name": "Gloomspite Gitz"
                },
            ]
        },
    ]
}

export const Factions = {
    "factions": [
    {
        "id": "stormcast",
        "name": "Stormcast Eternals - Vigilant Brotherhood",
        "battleTraits": [
        {
                "id": "shieldOfAzyr",
                "name": "Shield of Azyr",
                "effect": "Pick a friendly Unit.  Unit the start of your next turn, that unit has Ward 5+",
                "once": true,
                "phase": "hero",
                "table": false
        },
        {
                "id": "stormCharge",
                "name": "Storm Charge",
                "effect": "Pick a friendly unit that is not in combat, that unit can charge this turn even if a run was used",
                "once": true,
                "phase": "charge",
                "table": false
        }
        ],
        "regimentAbilities": [
            {
                "id": "strikeWhereNeeded",
                "name": "Strike Where Needed",
                "effect": "The unit using the retreat ability.  No mortal damange is inflicted when they use Retreat.  In addition, the unit can still use Charge this turn even though it used a retreat ability.",
                "once": true,
                "phase": "movement"
            },
            {
                "id": "blazeOfGlory",
                "name": "Blaze of Glory",
                "effect": "Pick a friendly unit that is in combat, each time a model is slain, make a vengance roll of D6.  On 4+ inflict 1 mortal damage",
                "once": true,
                "phase": "combat"
            }
        ],
        "enhancements": [
            {
                    "id": "hallowedScrolls",
                    "name": "Hallowed Scrolls",
                    "effect": "Your general has Ward 5+",
                    "once": false,
                    "phase": "combat",
                },
                {
                    "id": "morrdaTalon",
                    "name": "Morrda's Talon",
                    "effect": "Your general's Hallowed Greataxe has Crit (Mortal)",
                    "once": false,
                    "phase": "combat",
                },
                {
                    "id": "quickSilverDraught",
                    "name": "Quicksilver Draught",
                    "effect": "Your general has Strike-First this phase",
                    "once": true,
                    "phase": "combat",
                },
                {
                    "id": "nullPendant",
                    "name": "Null Pendant",
                    "effect": "Roll a dice for each enemy unit contesting the same objective, on a 2+, subtract the roll from the control score of that enemy unit this turn",
                    "once": true,
                    "phase": "end",
                },
            ],
        "units": ["LordVigilant (Hero)", "LordVertiant (1)", "Procecutors (5)", "Liberators (5)"]
        
    },
    {
        "id": "stormcast2",
        "name": "Stormcast Eternals - Yndrastra's Spearhead",
        "battleTraits": [
        {
                "id": "lightningStrikeArrival",
                "name": "Lightning Strike Arrival",
                "effect": "Yndrastra and your Annihilators are not setup during the deployment phase.  Instead, from the third battle round onward, they can use the following ability.  Setup this unit anywhere on the battlefield more than 6\" from all enemy units.",
                "once": false,
                "phase": "movement",
                "table": false
        }
        ],
        "regimentAbilities": [
            {
                "id": "driveThemBack",
                "name": "Drive Them Back",
                "effect": "Pick any number of friendly units that are borh contesting an objective and in combat.  Each of those units can make a pile-in move.  For each unit that did so, pick an enemy unit within 1\" of it and roll a dice.  On a 4+, inflict 1 mortal damage on the that enemy unit.",
                "once": false,
                "phase": "end"
            },
            {
            "id": "defendToTheLast",
                "name": "Defend to the Last",
                "effect": "Friendly units have a Ward(6+) while they are contesting an objective you control.",
                "once": false,
                "phase": "passive"
            }
        ],
        "enhancements": [
            {
                    "id": "thePrimeHuntress",
                    "name": "The Prime Huntress",
                    "effect": "The damage characteristic of your Thengavar is 2D6 for attacks that target a MONSTER.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "strikeWithTheTempestRage",
                    "name": "Strike with the Tempest Rage",
                    "effect": "Your general has STRIKE-FIRST if they charged in the same turn.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "dazzlingRadiance",
                    "name": "Dazzling Radiance",
                    "effect": "Pick your general to use this ability if they were set up this phase.  You return 1 slan model to each friendly unit wholly with 12\" of your general",
                    "once": true,
                    "phase": "movement",
                },
                {
                    "id": "hawkOfTheCelestrialSkies",
                    "name": "Hawk of the Celestrial Skies",
                    "effect": "Unit the end of the phase, add 1 to hit rolls for attacks made by friendly units while they are wholly within 12\" of your general.",
                    "once": true,
                    "phase": "combat",
                },],
        "units": ["Yndrastra (Hero)", "Knight Vexillor (1)", "Annihilators (3)", "Vanquishers (5)", "Vanquishers (5)", "Stormcast Chariot (1)"]
        
    },
    {
        "id": "skaven",
        "name": "Skaven - Gnawfeast Clawpack",
        "battleTraits": [
        {
                "id": "lurkingVermintide",
                "name": "The Lurking Vermintide",
                "effect": "Pick an undeployed friendly unit, set them up in the tunnels below.  On movement phase you can move from tunnels and set them up wholly within 6\" of a corner of the battlefield and more than 9\" from all enemy units",
                "once": true,
                "phase": "movement",
                "table": false
        }
        ],
        "regimentAbilities": [
            {
                "id": "warpstoneLacedBullets",
                "name": "Warpstone Laced Bullets",
                "effect": "Pick a ranged weapon on a friendly unit.  The weapon has Crit (Mortal) this phase.",
                "once": true,
                "phase": "shooting"
            },
            {
            "id": "toQuickToHit",
                "name": "To Quick to Hit",
                "effect": "No mortal damaged is inflicted when they use Retreat.",
                "once": false,
                "phase": "movement"
            }
        ],
        "enhancements": [
            {
                    "id": "leadTheSeethingHorde",
                    "name": "Lead the Seething Horde",
                    "effect": "Instead of using the setup instructions in the Call for Reinforcements ability, the replacement unit can be set up wholly within 13\" of this unit and not in combat",
                    "once": false,
                    "phase": "movement",
                },
                {
                    "id": "skryreConnections",
                    "name": "Skryre Connections",
                    "effect": "Your generals Ratling Pistol has an Attack characteristic of of 2D6 instead of D6.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "warpstoneCharm",
                    "name": "Warpstone Charm",
                    "effect": "Subtract 1 from save rolls for enemy unit in combat with your general",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "cloakOfStitchedVictories",
                    "name": "Cloak of Stitched Victories",
                    "effect": "Your general has Ward 5+",
                    "once": false,
                    "phase": "passive",
                },],
        "units": ["Clawlord on Gnaw-beast (Hero)", "Grey Seer (1)", "Warlock Engineer (1)", "Clanrats (10)", "Clanrats (10)", "Rat Orges (3)"]
        
    },
    {
        "id": "skaven2",
        "name": "Skaven - Warpspark Clawpack",
        "battleTraits": [
        {
                "id": "alwaysThreeCalowstepsAhead",
                "name": "Always Three Calowsteps Ahead",
                "effect": "Pick a friendly unit that is not in combat.  That untit can use Normal Move ability as if it were your movement phase. ",
                "once": true,
                "phase": "movement",
                "table": false
        }
        ],
        "regimentAbilities": [
            {
                "id": "warpstoneLacedArmor",
                "name": "Warpstone Laced Armor",
                "effect": "Your Stormfields unit has a Ward (4+) this phase.",
                "once": true,
                "phase": "combat"
            },
            {
            "id": "endlessSwarmOfRats",
                "name": "Endless Swarm of Rats",
                "effect": "When a friendly Clanrats unit uses it Seething Swarm abililty, you can return D6 slain models to that unit instead of D3.",
                "once": false,
                "phase": "passive"
            }
        ],
        "enhancements": [
            {
                    "id": "skilledManipulator",
                    "name": "Skilled Manipulator",
                    "effect": "Your general has a Ward (4+) while they are within 1\" of any friendly Clanrats unit.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "skitterleap",
                    "name": "Skitterleap",
                    "effect": "Make a casting roll of 2D6.  On a 6+, remove your general from the battield and set them up again on the battlefield more than 6\" from all enemy units.  They cannot use Move abilities in the following movement phase.",
                    "once": false,
                    "phase": "hero",
                },
                {
                    "id": "cageOfWarpLightning",
                    "name": "Cage of Warp Lightning",
                    "effect": "Pick a visible enemy unit within 12\" of your general and roll a dice.  On a 2+, the enemy unit has STRIKE-LAST this phase.  On a 1, inflict 1 mortal damage on your general.",
                    "once": true,
                    "phase": "combat",
                },
                {
                    "id": "scurryAway",
                    "name": "Scurry Away",
                    "effect": "Roll a dice.  On a 3+, this unit can immediately use the Retreat ability as if it were your movement phase.  If it does so, no mortal damage is inflicted when it uses Retreat.",
                    "once": false,
                    "phase": "combat",
                },],
        "units": ["Grey Seer (Hero)", "Stormfiends (3)", "Warp Ligtning Cannon (1)", "Clanrats (10)", "Clanrats (10)"]
        
    },

    {
        "id": "SoD",
        "name": "Slaves of Darkness",
        "battleTraits": [
        {
                "id": "eyeOfTheGods",
                "name": "Eye of the Gods",
                "effect": "Pick a friendly unit that is either contesting an objective not conotrlled by your opponent and is not in combat, or a unit that destroyed an enemy unit this turn.  Roll a dice.",
                "once": false,
                "phase": "passive",
                "table": true
        },
        ],
        "regimentAbilities": [
            {
                "id": "theDeadBanner",
                "name": "The Dead Banner",
                "effect": "Pick a friendly Chaos Warrior or Chaos Knight.  Immediately roll on the Eye of the Gods.",
                "once": false,
                "phase": "passive"
            },
            {
                "id": "fierceConquerors",
                "name": "Fierce Conquerors",
                "effect": "Add 3 to the control scores of friendly Chaos Warriors units.",
                "once": false,
                "phase": "passive"
            }
        ],
        "enhancements": [
            {
                    "id": "markOfKhorne",
                    "name": "Mark of Khorne",
                    "effect": "Add 1 to the Rend of yyour general's melee weapon if they charged in the same turn.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "markOfTzeentch",
                    "name": "Mark of Tzeentch",
                    "effect": "Pick a friendly unit that is not your general.  Remove that unit from the battlefield and set it up again wholly within 6\" of your general and more than 6\" from all enemy units.  It cannot use Move abilities for the rest of the phase.",
                    "once": true,
                    "phase": "movement",
                },
                {
                    "id": "markOfNurgle",
                    "name": "Mark of Nurgle",
                    "effect": "Subtract 1 from wound rolls for the combat attacks that target your general",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "markOfSlaanesh",
                    "name": "Mark of Slaanesh",
                    "effect": "Your general has Strike-First",
                    "once": false,
                    "phase": "passive",
                },
            ],
        "units": ["Choas Lord (Hero)", "Chaos Chariot (1)", "Chaos Warriors (5)", "Chaos Warriors (5)", "Chaos Knights (5)"]
        
    },
    {
        "id": "DoK",
        "name": "Daughters of Khaine",
        "battleTraits": [
        {
                "id": "bloodRites",
                "name": "Blood Rites",
                "effect": "At the start of each battle round, all friendly units gain the Blood Rites passive abilities that corresponds to the battle round number.",
                "once": false,
                "phase": "passive",
                "table": true
        }
        ],
        "regimentAbilities": [
            {
                "id": "murderousEpiphany",
                "name": "Murderous Epiphany",
                "effect": "All friendly units gain the Blood Rites passive abiliity they would have gained at the start of the net battle round(they keep this ability for the rest of the battle, but they do not gain it for a second time at the start of the next battle round).",
                "once": true,
                "phase": "hero"
            },
            {
            "id": "blessingOfKhaine",
                "name": "Blessing of Khaine",
                "effect": "Pick a friendly unit wholly within 12\" of your general.  You cannot pick your general.Add 1 to ward rolls for the unit this phase (only once per round).",
                "once": false,
                "phase": "anycombat"
            }
        ],
        "enhancements": [
            {
                    "id": "bathedInBlood",
                    "name": "Bathing in Blood",
                    "effect": "Each time a model is slain by your general, Heal 1.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "fuledByRevenge",
                    "name": "Fueled by Revenge",
                    "effect": "Add 1 to the Rend of melee weapons used by friendly Blood Stalkers while they are wholly within 12\" of your general.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "flaskOfShademist",
                    "name": "Flask of Shademist",
                    "effect": "Unit the end of the phase, subtract 1 from hit rolls for attacks that target friendly units while they are wholly within 12\" of your general.",
                    "once": true,
                    "phase": "passive",
                },
                {
                    "id": "zealousOperator",
                    "name": "Zealous Operator",
                    "effect": "Pick a friendly unit wholly within 9\" of your general that is not in combat.  Roll a dice for each slain model from the unit.  For each 5+, you can return 1 slain model to the unit.",
                    "once": false,
                    "phase": "hero",
                },],
        "units": ["Melusai Ironscale (Hero)", "Witch Aelves (5)", "Witch Aelves (5)", "Doomfire Warlocks (5)", "Blood Stalkers (5)"]
        
    },
    {
        "id": "fyreslayers",
        "name": "Fyreslayers",
        "battleTraits": [
        {
                "id": "urGoleRunes",
                "name": "Ur-Gole Runes",
                "effect": "Pick 1 of ur-gold runes, then make an activation roll of D6.  Each ur-gold runes can only be activated once per battle.  On a 1-5, the rune's standard effect applies.  On a 6, the enchanced effect applies.",
                "once": false,
                "phase": "passive",
                "table": true
        }
        ],
        "regimentAbilities": [
            {
                "id": "magicTunnels",
                "name": "Magic Tunnels",
                "effect": "Pick 2 friendly units, remove them from the battlefield and set them up again anywhere on the battfield more than 6\" from all enemy units.",
                "once": true,
                "phase": "start"
            },
            {
            "id": "fyresteelThrowingAxe",
                "name": "Fyresteel Throwing Axe",
                "effect": "Pick any number of friendly units that are not in combat and are within 10\" of any enemy units.  For each of those units, pick a visible enemy unit with 10\" and roll a dice.  On 4+, inflict D3 mortal damage on that enemey unit.",
                "once": false,
                "phase": "shooting"
            }
        ],
        "enhancements": [
            {
                    "id": "tooStubbornToDie",
                    "name": "Too Stubborn to Die",
                    "effect": "Heal D3 your general",
                    "once": false,
                    "phase": "start",
                },
                {
                    "id": "spiritIfGrimnir",
                    "name": "Spirit of Grimnir",
                    "effect": "You can re-roll activation rolls you make for the Ur-Gold runes ability",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "hornOfGrimnir",
                    "name": "Horn of Grimnir",
                    "effect": "Pick your general to use this ability if they are not in combat.  Roll a dice for each friendly unit on the battlefield.  For each 3+, you can return 1 slain model to the unit.",
                    "once": false,
                    "phase": "hero",
                },
                {
                    "id": "powerfulPresence",
                    "name": "Powerful Presence",
                    "effect": "Add 3 to your general's control score.",
                    "once": false,
                    "phase": "end",
                },],
        "units": ["Battlesmith (Hero)", "Hearthguard Berzerkers (5)", "Vulkite Berzerkers (5)", "Vulkite Berzerkers (5)", "Vulkite Berzerkers (5)", "Vulkite Berzerkers (5)"]
        
    },
    {
        "id": "nighthaunt",
        "name": "Nighthaunt",
        "battleTraits": [
        {
                "id": "waveOfTerror",
                "name": "Wave of Terror",
                "effect": "Pick a friendly unit to use this ability if they charged this phase and the charge roll was 10+, pick an enemy unit within 1\" of it.  That target has Strike-Last this turn.  Ignore all modifiers to save rolls rolls for friendly units (positive or negative).",
                "once": false,
                "phase": "passive",
                "table": false
        }
        ],
        "regimentAbilities": [
            {
                "id": "deathStalkers",
                "name": "Death Stalkers",
                "effect": "Pick an enemry unit on the battlefield.  Add 1 to the Rend characteric of melee weapons used for attacks that target this unit..",
                "once": false,
                "phase": "start"
            },
            {
            "id": "chorusOfTerror",
                "name": "Chorus of Terror",
                "effect": "Subtract 1 from hit rolls for combat attacks that target a friendly unit that charged in the same turn.",
                "once": false,
                "phase": "passive"
            }
        ],
        "enhancements": [
            {
                    "id": "soulfireRings",
                    "name": "Soulfire Rings",
                    "effect": "If any models were slain by your general this turn, heal D6 to your general.",
                    "once": false,
                    "phase": "end",
                },
                {
                    "id": "cloakedInShadow",
                    "name": "Cloaked in Shadow",
                    "effect": "No more than 1 enemy unit can target your general with attacks (shooting or combat) per phase.",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "beaconOfNagashizzar",
                    "name": "Beacon of Nagashizzar",
                    "effect": "Return 1 slain model to each friendly unit on the battlefield.",
                    "once": true,
                    "phase": "hero",
                },
                {
                    "id": "shadowsEdge",
                    "name": "Shadows Edge",
                    "effect": "Your general's Sword of StolenHours has Crit (Mortal)",
                    "once": false,
                    "phase": "passive",
                },],
        "units": ["Knight of Shrouds (Hero)", "Spirit Hosts (3)", "Grimghast Reapers (5)", "Grimghast Reapers (5)", "Chainrasps (10)", "Chainrasps (10)"]
        
    },
    {
        "id": "gloomspiteGitz",
        "name": "Gloomspite Gitz",
        "battleTraits": [
        {
                "id": "underTheLightOfTheBadMoon",
                "name": "Under the Light of the Bad Moon",
                "effect": "Pick a terrority (either friendly or enemy) to be under the light of the bad moon.  If both players can use the ability, the players roll off and the winner picks the terirory to be under the Light of the Bad moon.  The picked terrirory remains under the light of the bad moon for the first and second round.  In the third and fourth round, the other territory is selected.  While a unit is wholly within the territory that is under the light of the bad moon, the appropiate effect applies.",
                "once": false,
                "phase": "passive",
                "table": true
        }
        ],
        "regimentAbilities": [
            {
                "id": "theLunaticHordes",
                "name": "The Lunatic Hordes",
                "effect": "Pick a friendly Moonclan Stabbas unit.  You can return up to D3 slain models to the unit this turn.",
                "once": false,
                "phase": "hero"
            },
            {
            "id": "theHandOfGork",
                "name": "The Hand of Gork",
                "effect": "Pick a friendly unit that is not in combat.  Remove that unit from the battlefield and set it up again more than 9\" from all enemy units.",
                "once": true,
                "phase": "movement"
            }
        ],
        "enhancements": [
            {
                    "id": "fightAnotherDay",
                    "name": "Fight Another Day",
                    "effect": "Pick your general to use this ability if they used a fight ability this phase.  Your general can make a 2D6 move but cannot end that move in combat.",
                    "once": false,
                    "phase": "end",
                },
                {
                    "id": "theClammyCowl",
                    "name": "The Clammy Cowl",
                    "effect": "Subtract 1 from hit rolls that target your general",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "hallucinogenicFungusBrew",
                    "name": "Hallucinogenic Fungus Brew",
                    "effect": "Your general has Ward 4+ in the first battle round, Ward 5+ in the second battle round, and Ward6+ in the third and foruth battle round",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "nightshadeMushroom",
                    "name": "Nightshade Mushroom",
                    "effect": "Pick a friendly unit with your general's combat range.  That unit cannot be targeted by shooting attacks in the next shooting phase.",
                    "once": true,
                    "phase": "movement",
                },],
        "units": ["Loon Bose (Hero)", "Moonclan Stabbas (10)", "Moonclan Stabbas (10)", "Squig Hoopers (5)", "Squig Hoopers (5)", "Rockgut Troggoths (3)"]
        
    },
    {
        "id": "soulblight",
        "name": "Soulblight Gravelords",
        "battleTraits": [
        {
                "id": "swoopDown",
                "name": "Swoop Down",
                "effect": "Your Vargheists are not set up during the deployment phase.  Instead, from the third battle round onwards, it can set up this unit anywhere on the battlie more than 6\" from all enemy units during movement phase.  In addition, Each time a friendly Vampure unit users a FIGHT ability, after all of its attacks have been resolved, Heal(X) that vampire unit where X is the number of damage points allocated by those attacks.",
                "once": false,
                "phase": "passive",
                "table": false
        }
        ],
        "regimentAbilities": [
            {
                "id": "endlessLegions",
                "name": "Endless Legions",
                "effect": "Pick a friendly Deathrattle Skeletons unit.  You can set up a replacement unit with D6+4 models anywhere on the battlefield more than 6\" from all enemy units.",
                "once": true,
                "phase": "movement"
            },
            {
            "id": "ruinousChargers",
                "name": "Ruinous Chargers",
                "effect": "Pick your Blood Knights unit to use this ability if they charged this turn.  Inflick D3 mortal damage on each enemy unit it passed accross during the CHARGE abililty.",
                "once": false,
                "phase": "charge"
            }
        ],
        "enhancements": [
            {
                    "id": "graveSandShards",
                    "name": "Grave Sand Shards",
                    "effect": "You declare Skeleton Legion abillity for a unit within 9\" of your general.Add 1 to each legion roll made for this unit.",
                    "once": true,
                    "phase": "combat",
                },
                {
                    "id": "cloudOfBats",
                    "name": "Cloud of Bats",
                    "effect": "Remove yoru general from the battlefield and set them up again anywhere on the battlefield more than 6\" from all enemy units. ",
                    "once": true,
                    "phase": "movement",
                },
                {
                    "id": "auraOfNight",
                    "name": "Aura of Night",
                    "effect": "Ignore negative modifiers to save rolls for shooting attacks that target your general",
                    "once": false,
                    "phase": "passive",
                },
                {
                    "id": "spiritGale",
                    "name": "Spirit Gale",
                    "effect": "Make a casting roll of 2D6.  On a 7+, inflict 1 mortal damange on each enemy unit on the battlefield.",
                    "once": false,
                    "phase": "hero",
                },],
        "units": ["Vampire Lord (Hero)", "Deathrattle Skeletons (10)", "Deathrattle Skeletons (10)", "Blood Knights (5)", "Vargheists (3)"]
        
    },
]
};