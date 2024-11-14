import { phases } from "./phase";


export interface Factions {
    "factions": Faction[];
}

export interface Faction {
    id: number;
    name: string;
    battleTraits: BattleTrait[];
    regimentAbilities: RegimentAbilitiy[];
    enhancements: Enhancement[];
    units: string[];
}

export interface BattleTrait  {
    id: string;
    name: string;
    effect: string;
    once: number;
    phase: number;
    special: number;
    dialog?: Dialog | undefined;
}

export interface Dialog  {
    id: string;
    name: string;
    effect: string;
}
export interface RegimentAbilitiy {
    id: string;
    name: string;
    effect: string;
    once: number;
    phase: number;
    tags?: string[]; 
}

export interface Enhancement {
    id: string;
    name: string;
    effect: string;
    once: number;
    phase: number;
}

export const battleTraitSpecials = Object.freeze({
    none: 0,
    table: 1,
    counter: 2,
    multiple: 3,
    dialog: 4,
});

export const onces = Object.freeze({
    none: 0,
    battle: 1,
    turn: 2,
    phase: 3,
})

export const factions = Object.freeze({
    stormcastVigilantBrotherHood: 1,
    stormcastYndrastra: 2,
    skavenGnawfeastClawPack: 3,
    skavenWarpSparkClawPack: 4,
    slaveToDarknessBloodWindLegion: 5,
    soulblightGravelordsBloodCraveHunt: 6,
    fyreslayersSageAxeband: 7,
    disciplesOfTzeentchFluxbladeCoven: 8,
    daughtersOfKhaineHeartflayerTroupe: 9,
    citiesOfSigmarCasteliteCompany: 10,
    nighthauntSlasherHost: 11,
    sylvanethBitterbarkCopse: 12,
    maggotkinOfNurgleBleakHost: 13,
    seraphonStarscaleWarhost: 14,
    kharadronOverlordsSkyhammerTaskForce: 15,
    hedonitesOfSlaaneshBladeOfTheLuridDream: 16,
    luminethRealmLordsGlitteringPhalanx: 17,
    ossiarchBonereapersTitheReaperEchelon: 18,
    sonsOfBehematWallsmasherStomp: 19,
    bladesOfKhorneBloodboundGorePilgrims: 20,
    idonethDeepkinSoulraidHunt: 21,
    gloomspiteGitzBadMoonMadmob: 22,
    flesheaterCourtsCarrionRetainers: 23,
    ogorMawTribesTyrantsBellow: 24,
    orrukWarclans: 25,


})


export const Factions = {
    "factions": [
        {
            "id": factions.stormcastVigilantBrotherHood,
            "name": "Stormcast Eternals - Vigilant Brotherhood",
            "battleTraits": [
                {
                    "id": "holyOrders",
                    "name": "HolyOrders",
                    "effect": "During the battle, you can use the following abilities.",
                    "once": onces.none,
                    "phase": phases.any,
                    "special": battleTraitSpecials.multiple,
                    
                }

            ],
            "regimentAbilities": [
                {
                    "id": "strikeWhereNeeded",
                    "name": "Strike Where Needed",
                    "effect": "The unit using the retreat ability.  No mortal damange is inflicted when they use Retreat.  In addition, the unit can still use Charge this turn even though it used a retreat ability.",
                    "once": onces.battle,
                    "phase": phases.movement,
                    "tags": []
                },
                {
                    "id": "blazeOfGlory",
                    "name": "Blaze of Glory",
                    "effect": "Pick a friendly unit that is in combat, each time a model is slain, make a vengance roll of D6.  On 4+ inflict 1 mortal damage",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "hallowedScrolls",
                    "name": "Hallowed Scrolls",
                    "effect": "Your general has Ward 5+",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "morrdaTalon",
                    "name": "Morrda's Talon",
                    "effect": "Your general's Hallowed Greataxe has Crit (Mortal)",
                    "once": onces.none,
                    "phase": phases.combat,
                },
                {
                    "id": "quickSilverDraught",
                    "name": "Quicksilver Draught",
                    "effect": "Your general has Strike-First this phase",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },
                {
                    "id": "nullPendant",
                    "name": "Null Pendant",
                    "effect": "Roll a dice for each enemy unit contesting the same objective, on a 2+, subtract the roll from the control score of that enemy unit this turn",
                    "once": onces.battle,
                    "phase": phases.end,
                },
            ],
            "units": ["LordVigilant (Hero)", "LordVertiant (1)", "Procecutors (5)", "Liberators (5)"]

        },
        {
            "id": factions.stormcastYndrastra,
            "name": "Stormcast Eternals - Yndrastra's Spearhead",
            "battleTraits": [
                {
                    "id": "lightningStrikeArrival",
                    "name": "Lightning Strike Arrival",
                    "effect": "Yndrastra and your Annihilators are not setup during the deployment phase.  Instead, from the third battle round onward, they can use the following ability.  Setup this unit anywhere on the battlefield more than 6\" from all enemy units.",
                    "once": onces.none,
                    "phase": phases.movement,
                    "special": battleTraitSpecials.none,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "driveThemBack",
                    "name": "Drive Them Back",
                    "effect": "Pick any number of friendly units that are borh contesting an objective and in combat.  Each of those units can make a pile-in move.  For each unit that did so, pick an enemy unit within 1\" of it and roll a dice.  On a 4+, inflict 1 mortal damage on the that enemy unit.",
                    "once": onces.none,
                    "phase": phases.end,
                    "tags": []
                },
                {
                    "id": "defendToTheLast",
                    "name": "Defend to the Last",
                    "effect": "Friendly units have a Ward(6+) while they are contesting an objective you control.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "thePrimeHuntress",
                    "name": "The Prime Huntress",
                    "effect": "The damage characteristic of your Thengavar is 2D6 for attacks that target a MONSTER.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "strikeWithTheTempestRage",
                    "name": "Strike with the Tempest Rage",
                    "effect": "Your general has STRIKE-FIRST if they charged in the same turn.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "dazzlingRadiance",
                    "name": "Dazzling Radiance",
                    "effect": "Pick your general to use this ability if they were set up this phase.  You return 1 slan model to each friendly unit wholly with 12\" of your general",
                    "once": onces.battle,
                    "phase": phases.movement,
                },
                {
                    "id": "hawkOfTheCelestrialSkies",
                    "name": "Hawk of the Celestrial Skies",
                    "effect": "Unit the end of the phase, add 1 to hit rolls for attacks made by friendly units while they are wholly within 12\" of your general.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },],
            "units": ["Yndrastra (Hero)", "Knight Vexillor (1)", "Annihilators (3)", "Vanquishers (5)", "Vanquishers (5)", "Stormcast Chariot (1)"]

        },
        {
            "id": factions.skavenGnawfeastClawPack,
            "name": "Skaven - Gnawfeast Clawpack",
            "battleTraits": [
                {
                    "id": "lurkingVermintideDeployment",
                    "name": "Deployment",
                    "effect": "The Lurking Vermintide is completed during the deployment phase.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "warpstoneLacedBullets",
                    "name": "Warpstone Laced Bullets",
                    "effect": "Pick a ranged weapon on a friendly unit.  The weapon has Crit (Mortal) this phase.",
                    "once": onces.battle,
                    "phase": phases.shooting,
                    "tags": []
                },
                {
                    "id": "toQuickToHit",
                    "name": "To Quick to Hit",
                    "effect": "No mortal damaged is inflicted on friendly units when they use Retreat.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "leadTheSeethingHorde",
                    "name": "Lead the Seething Horde",
                    "effect": "Instead of using the setup instructions in the Call for Reinforcements ability, the replacement unit can be set up wholly within 13\" of this unit and not in combat",
                    "once": onces.none,
                    "phase": phases.movement,
                },
                {
                    "id": "skryreConnections",
                    "name": "Skryre Connections",
                    "effect": "Your generals Ratling Pistol has an Attack characteristic of of 2D6 instead of D6.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "warpstoneCharm",
                    "name": "Warpstone Charm",
                    "effect": "Subtract 1 from save rolls for enemy unit in combat with your general",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "cloakOfStitchedVictories",
                    "name": "Cloak of Stitched Victories",
                    "effect": "Your general has Ward 5+",
                    "once": onces.none,
                    "phase": phases.passive,
                },],
            "units": ["Clawlord on Gnaw-beast (Hero)", "Grey Seer (1)", "Warlock Engineer (1)", "Clanrats (10)", "Clanrats (10)", "Rat Orges (3)"]

        },
        {
            "id": factions.skavenWarpSparkClawPack,
            "name": "Skaven - Warpspark Clawpack",
            "battleTraits": [
                {
                    "id": "alwaysThreeCalowstepsAhead",
                    "name": "Always Three Calowsteps Ahead",
                    "effect": "Pick a friendly unit that is not in combat.  That untit can use Normal Move ability as if it were your movement phase. ",
                    "once": onces.phase,
                    "phase": phases.movement,
                    "special": battleTraitSpecials.none,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "warpstoneLacedArmor",
                    "name": "Warpstone Laced Armor",
                    "effect": "Your Stormfields unit has a Ward (4+) this phase.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                    "tags": []
                },
                {
                    "id": "endlessSwarmOfRats",
                    "name": "Endless Swarm of Rats",
                    "effect": "When a friendly Clanrats unit uses it Seething Swarm abililty, you can return D6 slain models to that unit instead of D3.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "skilledManipulator",
                    "name": "Skilled Manipulator",
                    "effect": "Your general has a Ward (4+) while they are within 1\" of any friendly Clanrats unit.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "skitterleap",
                    "name": "Skitterleap",
                    "effect": "Make a casting roll of 2D6.  On a 6+, remove your general from the battield and set them up again on the battlefield more than 6\" from all enemy units.  They cannot use Move abilities in the following movement phase.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "cageOfWarpLightning",
                    "name": "Cage of Warp Lightning",
                    "effect": "Pick a visible enemy unit within 12\" of your general and roll a dice.  On a 2+, the enemy unit has STRIKE-LAST this phase.  On a 1, inflict 1 mortal damage on your general.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },
                {
                    "id": "scurryAway",
                    "name": "Scurry Away",
                    "effect": "Roll a dice.  On a 3+, this unit can immediately use the Retreat ability as if it were your movement phase.  If it does so, no mortal damage is inflicted when it uses Retreat.",
                    "once": onces.none,
                    "phase": phases.anycombat,
                },],
            "units": ["Grey Seer (Hero)", "Stormfiends (3)", "Warp Ligtning Cannon (1)", "Clanrats (10)", "Clanrats (10)"]

        },

        {
            "id": factions.slaveToDarknessBloodWindLegion,
            "name": "Slaves of Darkness - Bloodwind Legion",
            "battleTraits": [
                {
                    "id": "eyeOfTheGods",
                    "name": "Eye of the Gods",
                    "effect": "Pick a friendly unit that is either contesting an objective not conotrlled by your opponent and is not in combat, or a unit that destroyed an enemy unit this turn.  Roll a dice.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.table,
                    
                    
                },
            ],
            "regimentAbilities": [
                {
                    "id": "theDeadBanner",
                    "name": "The Dead Banner",
                    "effect": "Start of first battle round.  Pick a friendly Chaos Warrior or Chaos Knight.  Immediately roll on the Eye of the Gods.",
                    "once": onces.battle,
                    "phase": phases.start,
                    "tags": []
                },
                {
                    "id": "fierceConquerors",
                    "name": "Fierce Conquerors",
                    "effect": "Add 3 to the control scores of friendly Chaos Warriors units.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "markOfKhorne",
                    "name": "Mark of Khorne",
                    "effect": "Add 1 to the Rend of yyour general's melee weapon if they charged in the same turn.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "markOfTzeentch",
                    "name": "Mark of Tzeentch",
                    "effect": "Pick a friendly unit that is not your general.  Remove that unit from the battlefield and set it up again wholly within 6\" of your general and more than 6\" from all enemy units.  It cannot use Move abilities for the rest of the phase.",
                    "once": onces.battle,
                    "phase": phases.movement,
                },
                {
                    "id": "markOfNurgle",
                    "name": "Mark of Nurgle",
                    "effect": "Subtract 1 from wound rolls for the combat attacks that target your general",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "markOfSlaanesh",
                    "name": "Mark of Slaanesh",
                    "effect": "Your general has Strike-First",
                    "once": onces.none,
                    "phase": phases.passive,
                },
            ],
            "units": ["Choas Lord (Hero)", "Chaos Chariot (1)", "Chaos Warriors (5)", "Chaos Warriors (5)", "Chaos Knights (5)"]

        },
        {
            "id": factions.daughtersOfKhaineHeartflayerTroupe,
            "name": "Daughters of Khaine - Heartflayer Troupe",
            "battleTraits": [
                {
                    "id": "bloodRites",
                    "name": "Blood Rites",
                    "effect": "At the start of each battle round, all friendly units gain the Blood Rites passive abilities that corresponds to the battle round number.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.table,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "murderousEpiphany",
                    "name": "Murderous Epiphany",
                    "effect": "All friendly units gain the Blood Rites passive abiliity they would have gained at the start of the net battle round(they keep this ability for the rest of the battle, but they do not gain it for a second time at the start of the next battle round).",
                    "once": onces.battle,
                    "phase": phases.hero,
                    "tags": []
                },
                {
                    "id": "blessingOfKhaine",
                    "name": "Blessing of Khaine",
                    "effect": "Pick a friendly unit wholly within 12\" of your general.  You cannot pick your general.Add 1 to ward rolls for the unit this phase (only once per round).",
                    "once": onces.none,
                    "phase": phases.anycombat,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "bathedInBlood",
                    "name": "Bathing in Blood",
                    "effect": "Each time a model is slain by your general, Heal 1.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "fuledByRevenge",
                    "name": "Fueled by Revenge",
                    "effect": "Add 1 to the Rend of melee weapons used by friendly Blood Stalkers while they are wholly within 12\" of your general.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "flaskOfShademist",
                    "name": "Flask of Shademist",
                    "effect": "Unit the end of the phase, subtract 1 from hit rolls for attacks that target friendly units while they are wholly within 12\" of your general.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },
                {
                    "id": "zealousOperator",
                    "name": "Zealous Operator",
                    "effect": "Pick a friendly unit wholly within 9\" of your general that is not in combat.  Roll a dice for each slain model from the unit.  For each 5+, you can return 1 slain model to the unit.",
                    "once": onces.none,
                    "phase": phases.hero,
                },],
            "units": ["Melusai Ironscale (Hero)", "Witch Aelves (5)", "Witch Aelves (5)", "Doomfire Warlocks (5)", "Blood Stalkers (5)"]

        },
        {
            "id": factions.fyreslayersSageAxeband,
            "name": "Fyreslayers - Saga Axeband",
            "battleTraits": [
                {
                    "id": "urGoleRunes",
                    "name": "Ur-Gole Runes",
                    "effect": "Pick 1 of ur-gold runes, then make an activation roll of D6.  Each ur-gold runes can only be activated once per battle.  On a 1-5, the rune's standard effect applies.  On a 6, the enchanced effect applies.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.table,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "magicTunnels",
                    "name": "Magic Tunnels",
                    "effect": "Start of first battle round.  Pick 2 friendly units, remove them from the battlefield and set them up again anywhere on the battfield more than 6\" from all enemy units.",
                    "once": onces.battle,
                    "phase": phases.start,
                    "tags": []
                },
                {
                    "id": "fyresteelThrowingAxe",
                    "name": "Fyresteel Throwing Axe",
                    "effect": "Pick any number of friendly units that are not in combat and are within 10\" of any enemy units.  For each of those units, pick a visible enemy unit with 10\" and roll a dice.  On 4+, inflict D3 mortal damage on that enemey unit.",
                    "once": onces.turn,
                    "phase": phases.shooting,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "tooStubbornToDie",
                    "name": "Too Stubborn to Die",
                    "effect": "Heal D3 your general",
                    "once": onces.none,
                    "phase": phases.start,
                },
                {
                    "id": "spiritIfGrimnir",
                    "name": "Spirit of Grimnir",
                    "effect": "You can re-roll activation rolls you make for the Ur-Gold runes ability",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "hornOfGrimnir",
                    "name": "Horn of Grimnir",
                    "effect": "Pick your general to use this ability if they are not in combat.  Roll a dice for each friendly unit on the battlefield.  For each 3+, you can return 1 slain model to the unit.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "powerfulPresence",
                    "name": "Powerful Presence",
                    "effect": "Add 3 to your general's control score.",
                    "once": onces.none,
                    "phase": phases.end,
                },],
            "units": ["Battlesmith (Hero)", "Hearthguard Berzerkers (5)", "Vulkite Berzerkers (5)", "Vulkite Berzerkers (5)", "Vulkite Berzerkers (5)", "Vulkite Berzerkers (5)"]

        },
        {
            "id": factions.nighthauntSlasherHost,
            "name": "Nighthaunt - Slasher Host",
            "battleTraits": [
                {
                    "id": "waveOfTerrorOverview",
                    "name": "Night Haunt Battle Traits",
                    "effect": "You can use the following abilities.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "deathStalkers",
                    "name": "Death Stalkers",
                    "effect": "Pick an enemry unit on the battlefield.  Add 1 to the Rend characteric of melee weapons used for attacks that target this unit..",
                    "once": onces.none,
                    "phase": phases.start,
                    "tags": []
                },
                {
                    "id": "chorusOfTerror",
                    "name": "Chorus of Terror",
                    "effect": "Subtract 1 from hit rolls for combat attacks that target a friendly unit that charged in the same turn.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "soulfireRings",
                    "name": "Soulfire Rings",
                    "effect": "If any models were slain by your general this turn, heal D6 to your general.",
                    "once": onces.none,
                    "phase": phases.end,
                },
                {
                    "id": "cloakedInShadow",
                    "name": "Cloaked in Shadow",
                    "effect": "No more than 1 enemy unit can target your general with attacks (shooting or combat) per phase.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "beaconOfNagashizzar",
                    "name": "Beacon of Nagashizzar",
                    "effect": "Return 1 slain model to each friendly unit on the battlefield.",
                    "once": onces.battle,
                    "phase": phases.hero,
                },
                {
                    "id": "shadowsEdge",
                    "name": "Shadows Edge",
                    "effect": "Your general's Sword of StolenHours has Crit (Mortal)",
                    "once": onces.none,
                    "phase": phases.passive,
                },],
            "units": ["Knight of Shrouds (Hero)", "Spirit Hosts (3)", "Grimghast Reapers (5)", "Grimghast Reapers (5)", "Chainrasps (10)", "Chainrasps (10)"]

        },
        {
            "id": factions.gloomspiteGitzBadMoonMadmob,
            "name": "Gloomspite Gitz - Bad Moon Madmob",
            "battleTraits": [
                {
                    "id": "underTheLightOfTheBadMoon",
                    "name": "Under the Light of the Bad Moon",
                    "effect": "Pick a terrority (either friendly or enemy) to be under the light of the bad moon.  If both players can use the ability, the players roll off and the winner picks the terirory to be under the Light of the Bad moon.  The picked terrirory remains under the light of the bad moon for the first and second round.  In the third and fourth round, the other territory is selected.  While a unit is wholly within the territory that is under the light of the bad moon, the appropiate effect applies.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.table,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "theLunaticHordes",
                    "name": "The Lunatic Hordes",
                    "effect": "Pick a friendly Moonclan Stabbas unit.  You can return up to D3 slain models to the unit this turn.",
                    "once": onces.none,
                    "phase": phases.hero,
                    "tags": []
                },
                {
                    "id": "theHandOfGork",
                    "name": "The Hand of Gork",
                    "effect": "Pick a friendly unit that is not in combat.  Remove that unit from the battlefield and set it up again more than 9\" from all enemy units.",
                    "once": onces.battle,
                    "phase": phases.movement,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "fightAnotherDay",
                    "name": "Fight Another Day",
                    "effect": "Pick your general to use this ability if they used a fight ability this phase.  Your general can make a 2D6 move but cannot end that move in combat.",
                    "once": onces.none,
                    "phase": phases.end,
                },
                {
                    "id": "theClammyCowl",
                    "name": "The Clammy Cowl",
                    "effect": "Subtract 1 from hit rolls that target your general",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "hallucinogenicFungusBrew",
                    "name": "Hallucinogenic Fungus Brew",
                    "effect": "Your general has Ward 4+ in the first battle round, Ward 5+ in the second battle round, and Ward6+ in the third and foruth battle round",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "nightshadeMushroom",
                    "name": "Nightshade Mushroom",
                    "effect": "Pick a friendly unit with your general's combat range.  That unit cannot be targeted by shooting attacks in the next shooting phase.",
                    "once": onces.battle,
                    "phase": phases.movement,
                },],
            "units": ["Loon Bose (Hero)", "Moonclan Stabbas (10)", "Moonclan Stabbas (10)", "Squig Hoopers (5)", "Squig Hoopers (5)", "Rockgut Troggoths (3)"]

        },
        {
            "id": factions.soulblightGravelordsBloodCraveHunt,
            "name": "Soulblight Gravelords - Bloodcrave Hunt",
            "battleTraits": [
                {
                    "id": "deathsDescent",
                    "name": "Death's Descent",
                    "effect": "Your Vargheists unit is not set up during the deployment phase.  Instead, from the third battle round onwards, it can use the Swoop Down Ability.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "endlessLegions",
                    "name": "Endless Legions",
                    "effect": "Pick a friendly Deathrattle Skeletons unit.  You can set up a replacement unit with D6+4 models anywhere on the battlefield more than 6\" from all enemy units.",
                    "once": onces.battle,
                    "phase": phases.movement,
                    "tags": []
                },
                {
                    "id": "ruinousChargers",
                    "name": "Ruinous Chargers",
                    "effect": "Pick your Blood Knights unit to use this ability if they charged this turn.  Inflick D3 mortal damage on each enemy unit it passed accross during the CHARGE abililty.",
                    "once": onces.none,
                    "phase": phases.charge,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "graveSandShards",
                    "name": "Grave Sand Shards",
                    "effect": "You declare Skeleton Legion abillity for a unit within 9\" of your general.Add 1 to each legion roll made for this unit.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },
                {
                    "id": "cloudOfBats",
                    "name": "Cloud of Bats",
                    "effect": "Remove yoru general from the battlefield and set them up again anywhere on the battlefield more than 6\" from all enemy units. ",
                    "once": onces.battle,
                    "phase": phases.movement,
                },
                {
                    "id": "auraOfNight",
                    "name": "Aura of Night",
                    "effect": "Ignore negative modifiers to save rolls for shooting attacks that target your general",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "spiritGale",
                    "name": "Spirit Gale",
                    "effect": "Make a casting roll of 2D6.  On a 7+, inflict 1 mortal damange on each enemy unit on the battlefield.",
                    "once": onces.none,
                    "phase": phases.hero,
                },],
            "units": ["Vampire Lord (Hero)", "Deathrattle Skeletons (10)", "Deathrattle Skeletons (10)", "Blood Knights (5)", "Vargheists (3)"]

        },
        {
            "id": factions.maggotkinOfNurgleBleakHost,
            "name": "Maggotkin of Nurgle - Bleak Host",
            "battleTraits": [
                {
                    "id": "infectiousHosts",
                    "name": "Infectious Hosts",
                    "effect": "One of your Purgoyle Blightlords and one of your Plaguebearers are not set up during the deployment phase.  Instead from the third battle round onwards, you can use the ability Daemonic Summoning.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "locusOfFecundity",
                    "name": "Locus of Fecundity",
                    "effect": "Pick a friendly unit.  Heal D3 to that unit.",
                    "once": onces.phase,
                    "phase": phases.hero,
                    "tags": []
                },
                {
                    "id": "infestedWithWonders",
                    "name": "Infested with Wonders",
                    "effect": "Eash time an friendly model is slain, before it is removed from the battlefield, you can pick a enemy model within 1\" of it and roll a dice.  On a 4+, inflict 1 mortal damage on that unit.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": []
                }
            ],
            "enhancements": [
                {
                    "id": "summonerOfPlaguebearers",
                    "name": "Summoner of Plaguebearers",
                    "effect": "Pick a friendly Plaguebearers unit and wholly within 14\" of your general.  Return 1 slain model to the unit.",
                    "once": onces.none,
                    "phase": phases.end,
                },
                {
                    "id": "gardenerOfNurgle",
                    "name": "Gardener of Nurgle",
                    "effect": "If your general is contesting an objective not contested by enemy models, roll a dice.  On a 3+, that objective is contested by you to be desecrated.  Friendly units have Ward(4)+ while they are contesting a desecrated objective.  If your opponent gains control of a desecrated objective, it is no longer desecrated.",
                    "once": onces.none,
                    "phase": phases.movement,
                },
                {
                    "id": "pestilentBreath",
                    "name": "Pestilent Breath",
                    "effect": "Pick an enemy unit within 7\" of your general and roll a dice for each model in the unit.  For each 5+, inflict 1 mortal damage on that unit.",
                    "once": onces.none,
                    "phase": phases.shooting,
                },
                {
                    "id": "giftOfTheFerbileFrenzy",
                    "name": "Gift of the Ferbile Frenzy",
                    "effect": "Unit the end of the phase, add 1 to the Attacks characteristic of melee weapons used by friendly units while they are wholly within 7\" of your general.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },],
            "units": ["Spoilpox Scrivener (Hero)", "Pusgoyle Blightlord (1)", "Pusgoyle Blightlord (1)", "Putrid Blightkings (5)", "Putrid Blightkings (5)", "Plaguebears (5)", "Plaguebearers (5)"]

        },
        {
            "id": factions.kharadronOverlordsSkyhammerTaskForce,
            "name": "Kharadron Overlords - Skyhammer Task Force",
            "battleTraits": [
                {
                    "id": "plyTheSkies",
                    "name": "Ply the Skies",
                    "effect": "You declared a non-charge move ability for the Arkanaut Frigate.  Pick a friendly INFANTRY unit that is wholly within the combat range of the Arkanaut Frigate and not in combat to be transported.  Remove the INFANTRY unit from the battlefield.  Then when the Arkanaut Frigate is ends its move, set up the infantry unit n the battlefield again, wholly within combat range of the Arknaunt Frigate and not in combat.  A unit cannot use the Charge ability if it was transported in the same turn.",
                    "once": onces.none,
                    "phase": phases.movement,
                    "special": battleTraitSpecials.none,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "assaultBoats",
                    "name": "Assault Boats",
                    "effect": "Pick a friendly unit that was transported this turn to use this ability.  That unit can still use CHARGE Abilities later in the turn.",
                    "once": onces.battle,
                    "phase": phases.movement,
                    "tags": []
                },
                {
                    "id": "disengage",
                    "name": "Disengage",
                    "effect": "Pick a friendly Arkanaut Frigate to use this ability.  If that unit uses a RETREAT ability this phase, no mortal damage is inflicted on it and it can still use SHOOT abilities later in this turn.",
                    "once": onces.battle,
                    "phase": phases.movement,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "masterwroughtArmour",
                    "name": "Masterwrought Armour",
                    "effect": "Your general has Ward 5+.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "flaskOfVintageGorogna",
                    "name": "Flask of Vintage Gorogna",
                    "effect": "Heal (D6) to your general.",
                    "once": onces.battle,
                    "phase": phases.hero,
                },
                {
                    "id": "theresNiRewardWithoutRisk",
                    "name": "There's No Reward Without Risk",
                    "effect": "Reaction.  You declared a CHARGE ability for a unit wholly within 12\" of your general.  You can re-roll the charge roll for that CHARGE ability.",
                    "once": onces.battle,
                    "phase": phases.charge,
                },
                {
                    "id": "leaeNoDuardidBehind",
                    "name": "Leave No Duardid Behind",
                    "effect": "Pick a friendly Arkanaunt Company unit wholly within 12\" of your general and roll a dice for each slain model from this unit.  For each 4+, you can return 1 slain model to the unit.",
                    "once": onces.battle,
                    "phase": phases.hero,
                },],
            "units": ["Arkanaut Admiral (Hero)", "Arkanaut Company[incl. Skypike] (5)", "Arkanaut Company[incl. Light Skyhook and Aethermatic Volley Gun] (5)", "Skywardens (3)", "Arkanaut Frigate (1)"]

        },
        {
            "id": factions.disciplesOfTzeentchFluxbladeCoven,
            "name": "Disciples of Tzeentch - Fluxblade Coven",
            "battleTraits": [
                {
                    "id": "mastersOfDestiny",
                    "name": "Master of Destiny",
                    "effect": "Roll 9 dice and put them to one side.  These are your destiny dice.  During the battle, instead of rolling the dice for 1 of the rolls from the list opposite, you can pick one of your destiny dice and use it as the roll.  Once a destiny dice has been used, it is discarded.  If you want to replace a roll that uses more than one D6, you must use the same number of Destiny Dice.  (2 dice to replace 2D6 casting roll).  The following can be replaced with destiny dice:  Casting Rolls, Run Rolls, Charge Rolls, Hitt Rolls, Wound Rolls, Save Rolls (You must still modify the save by the Rend)",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.none,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "transientForms",
                    "name": "Transient Forms",
                    "effect": "Rll a dice each time a friend Kairic Acolytes model is slain in a combat phase.  On a 4+, you can return 1 slain model to the friendly Tzaangors unit within 9\" of the slaim model.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": []
                },
                {
                    "id": "eternalConflagration",
                    "name": "Eternal Conflagration",
                    "effect": "Add 1 to the Rend charactesistic of ranged weapons used by friendly Flamers of Tzeentch units.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "shieldOfFate",
                    "name": "Shield of Fate",
                    "effect": "Pick a visible friendly unit wholly within 18\" of your general, then make a casting roll of 2D6.  On a 6+, until the start of your next turn, that unit has a Ward(6+).  If that unit already has a ward save, add 1 to ward rolls for that unit unilt the start of the next turn instead.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "daemonheart",
                    "name": "DaemonHeart",
                    "effect": "Pick an enemy unit within 1\" of your general.  Inflict an amount of mortal damage on that unit equal to the number of the current battle round.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },
                {
                    "id": "glimpseTheFuture",
                    "name": "If you have fewer than 6 destiny dice, make a casting roll of 2D6.  On a 7+, you can roll a dice and add it to your destiny dice.",
                    "effect": "",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "timeslipPendant",
                    "name": "Timeslip Pendant",
                    "effect": "Pick an enemy unit within 9\" of your general.  That unit has STRIKE-LAST this phase.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },],
            "units": ["Magister on Disc of Tzeentch (Hero)", "Flamers of Tzeentch (3)", "Screamers of Tzeentch (3)", "Tzaangors (5)", "Tzaangors (5)", "Kairic Acolytes (10)"]

        },
        {
            "id": factions.orrukWarclans,
            "name": "Orruk Warclans - Swampskulka Gang",
            "battleTraits": [
                {
                    "id": "kruleboyzWaagh",
                    "name": "Kruleboyz WAAGH!",
                    "effect": "Pivk your general to use this ability, then pick another friendly unit wholly within 12\" of them to be the target.  You general and the garget has STRIKE-FIRST this phase",
                    "once": onces.battle,
                    "phase": phases.combat,
                    "special": battleTraitSpecials.none,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "noisyRacket",
                    "name": "Noisy Racket",
                    "effect": "subtract 1 from wound rolls for attacks made by enemy units in the first battle round.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                },
                {
                    "id": "coveredInMud",
                    "name": "Covered In Mud",
                    "effect": "In the first Battle round.  Pick a friendly unit to use this ability.  In this battle, that unit is not visible to enemy models that are more than 12\" away from it.",
                    "once": onces.battle,
                    "phase": phases.start,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "egomaniak",
                    "name": "Egomaniak",
                    "effect": "If any other friendly units are within your general's combat range, before you allocate a damage point to your general, roll a dice.  On a 4+ you must allocate that damage point to one of those units instead.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "morksEyePebble",
                    "name": "Mork's Eye Pebble",
                    "effect": "In the next shooting phase, friendly units have a Ward (5+) while they are wholly within 12\" of your general.",
                    "once": onces.battle,
                    "phase": phases.movement,
                },
                {
                    "id": "kunninPlan",
                    "name": "Kunnin' Plan",
                    "effect": "Pick a friendly unit wholly within 12\" of your general.  If that unit uses a RETREAT ability this turn, no mortal damage is inflicted on it and it can still use SHOOT and/or CHARGE abilityes later in the turn.",
                    "once": onces.battle,
                    "phase": phases.hero,
                },
                {
                    "id": "eyeBiterAsh",
                    "name": "Eye-Biter Ash",
                    "effect": "Pick an enemy unit in combat with your general and roll a dice.  On a 1-4 subtract 1 from hit rolls for attacks made by that unit for the rest of the phase.  On a 5+, subtract 1 from hit rolls for attacks made by this unit for the rest of the battle.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },],
            "units": ["Killaboss on Great Gnashtoof (Hero)", "Murknob with Belcha-banna (1)", "Man-skewer Boltboyz (3)", "Gutrippaz (5)", "Gutrippaz (5)", "Beast-skewer Killbow (1)"]

        },
        {
            "id": factions.seraphonStarscaleWarhost,
            "name": "Seraphon - Starscale Warhost",
            "battleTraits": [
                {
                    "id": "beastOfTheDarkJungles",
                    "name": "Beat of the Dark Jungles",
                    "effect": "Pick your general to use this ability if they are in combat.  Pick 1 of the following.  Gargantuan Jaws:  Pick an enemy unit in combat with your general and roll a dice.  If the roll exceeds that unit's Health, 1 model in that unit is slain. Roar:  Pick an enemy unit in combat with your general.  Subtract D6 from that unit's control score this turn.",
                    "once": onces.none,
                    "phase": phases.anycombat,
                    "special": battleTraitSpecials.none,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "predatoryFighters",
                    "name": "Predatory Fighters",
                    "effect": "Roll a dice for each enemy unit in combat with any friendly units.  On a 3+, inflict mortal damage on the unit being rolled for.",
                    "once": onces.phase,
                    "phase": phases.end,
                    "tags": []
                },
                {
                    "id": "templeCityGuardians",
                    "name": "Templa City Guardians",
                    "effect": "Friendly units have Ward (6+) while they are wholly within friendly territory.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "sotekGaze",
                    "name": "Sotek's Gaze",
                    "effect": "Roll a dice.  Add the roll to your general's control score this turn.",
                    "once": onces.none,
                    "phase": phases.end,
                },
                {
                    "id": "ancientStrategist",
                    "name": "Ancient Strategist",
                    "effect": "Pick a friendly unit wholly within 12\" of your general.  You cannot pick your general.",
                    "once": onces.battle,
                    "phase": phases.movement,
                },
                {
                    "id": "bladeOfRealities",
                    "name": "Blade of Realities",
                    "effect": "Add 1 to the rend characteristic of your general's Relic Celestilee Weapon",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "theWrathOfChiotec",
                    "name": "The Wrath Chotec",
                    "effect": "The attacks characteristic of your general's Sunbolt Gauntlet is 6 instead of D6",
                    "once": onces.none,
                    "phase": phases.passive,
                },],
            "units": ["Saurus Oldblood on Carnosaur (Hero)", "Saurus Warriors (5)", "Saurus Warriors (5)", "Kroxigor (3)"]

        },
        {
            "id": factions.luminethRealmLordsGlitteringPhalanx,
            "name": "Lumineth Realm-Lords - Glittering Phalanx",
            "battleTraits": [
                {
                    "id": "shiningCompay",
                    "name": "Shinning Company",
                    "effect": "Once per phase.  A friendly unit targeted by an ATTACK ability and that has not made a pile-in move this turn.  Subtract 1 from hit rolls for the attacks that target that friendly unit.",
                    "once": onces.phase,
                    "phase": phases.combat,
                    "special": battleTraitSpecials.none,
                    
                },
                {
                    "id": "powerOfHysh",
                    "name": "Power of Hysh",
                    "effect": "Once per turn.  Pick a friednly unit.  Roll a dice.  On a 2+, until the start of your next turn, attacks made by that untit score a critical hit on unmodified hit rolls of 5+",
                    "once": onces.turn,
                    "phase": phases.hero,
                    "special": battleTraitSpecials.none,
                },
                {
                    "id": "lightningReactions",
                    "name": "Lightning Reactions",
                    "effect": "When players are alternating picking units to use a FIGHT ability, when it is your turn to pick a unit, you can pick 2 units instead of 1.  Resolve the second FIGHT ability immediately after the first.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.none,
                }



            ],
            "regimentAbilities": [
                {
                    "id": "arcanePowers",
                    "name": "Arcane Powers",
                    "effect": "Add 1 to casting rolls for your general",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                },
                {
                    "id": "heightenedReflexes",
                    "name": "Heightened Reflexes",
                    "effect": "Add 1 to save rolls for friendly units that use a FIGHT ability immediately after another friendly unit because of the 'Lightning Reactins' ability, until the end of the phase.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "overwhelmingHeat",
                    "name": "Overwhelming Heat",
                    "effect": "Pick a visible enemy within 24\" of your general, then make a casting roll of 2D6.  On a 7+, halve rh Move characteristic of that unit until the start of your next turn and roll a dice.  If the roll equals or exceeds that unit's Save characteristic, inflict D3 mortal damage on it.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "protectionOfHysh",
                    "name": "Protection of Hysh",
                    "effect": "Pick a visible friendly unit wholly within 12\" of your general to be the target, then make a casting roll of 2D6.  On a 7+, the target has Ward(5+) unit the start of your next turn.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "waystone",
                    "name": "Waystone",
                    "effect": "Remove your general from the battlefield and set up them again anywhere on the battlefield more than 6\" from all enemy units.",
                    "once": onces.none,
                    "phase": phases.movement,
                },
                {
                    "id": "speedOfHysh",
                    "name": "Speed of Hysh",
                    "effect": "Pick a visible friendly unit wholly within 18\" of your general, then make a casting roll of 2S6.  On a 5+, double the Move characteristic of that unit until the start of your next turn.",
                    "once": onces.none,
                    "phase": phases.hero,
                },],
            "units": ["Scinari Cathallar (Hero)", "Vanari Auralan Sentinels (5)", "Vanari Auralan Sentinels (5)", "Vanari Auralan Wardens (10)", "Vanari Bladelords (5)"]

        },
        {
            "id": factions.idonethDeepkinSoulraidHunt,
            "name": "Idoneth Deepkin - Soulraid Hunt",
            "battleTraits": [
                {
                    "id": "tidesOfDeath",
                    "name": "Tides of Death",
                    "effect": "In each battleround, all friendly units have the Tides of Death passive ability that corresponds to the curent battle round number as shown in the table.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.table,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "wayOfTheCrestingWave",
                    "name": "Way of the Creshing Wave",
                    "effect": "Add 1 to the Rend characteristic of melee weapons used by friendly Namarti Thralls units that charged in the same turn.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                },
                {
                    "id": "etherseaPredator",
                    "name": "Ethersea Predator",
                    "effect": "Pick a friendly Cavalry unit that used a FIGHT ability this turn.  Heal (D3) that unit.",
                    "once": onces.none,
                    "phase": phases.end,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "archRitualist",
                    "name": "Arch-Ritualist",
                    "effect": "Add 1 to rolls for your general's Ritual of the Creeping Mist ability.",
                    "once": onces.none,
                    "phase": phases.passive,
                },

                {
                    "id": "steelshellArmor",
                    "name": "Steelshell Armor",
                    "effect": "Ignore all modifiers to save rolls for you general (positive and negative)",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "mindFlare",
                    "name": "Mind Flare",
                    "effect": "Pick an enemy unit in combat with your general.  Unit the end of the phase, attacks made by this unit only score hits on unmodified hit rolls of 6.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                },
                {
                    "id": "deliciousMorsels",
                    "name": "Delicious Morsels",
                    "effect": "Heal (1) each friendly Cavalry unit within your general's combat range.",
                    "once": onces.none,
                    "phase": phases.hero,
                },],
            "units": ["Isharann Soulscyer (Hero)", "Akhelian Morrsarr Guard (3)", "Akhelian Allopex (1)", "Namarti Thralls (5)", "Namarti Thralls (5)"]

        },
        {
            "id": factions.flesheaterCourtsCarrionRetainers,
            "name": "Fleash-eater Courts - Carrion Retains",
            "battleTraits": [
                {
                    "id": "carrionRetainersBattleTraits",
                    "name": "Carrion Retainers Battle traits",
                    "effect": "All of these abilities are active during the battlle",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "crusadingArmy",
                    "name": "Crusading Army",
                    "effect": "Add 1 to run rolls and charge rolls for friendly units.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                },
                {
                    "id": "defendersOfTheRealm",
                    "name": "Defenders of the Realm",
                    "effect": "Add 1 to save rolls for friendly units that are contesting an objective you control.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "ulguanCloak",
                    "name": "Ulguan Cload",
                    "effect": "Your general is not visible to enemy models that are more than 12\" away from them.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "bloodRiverChalice",
                    "name": "Blood-river Chalice",
                    "effect": "Heal (2D3) your general.",
                    "once": onces.battle,
                    "phase": phases.hero,
                },
                {
                    "id": "rousingOration",
                    "name": "Rousing Oraltion",
                    "effect": "Roll a dice for each friendly unit wholly within 12\" of your general.  Do not roll a dice for your general.  For each 5+, give 1 noble deeds point to your general.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "crisonVictuals",
                    "name": "Crismson Victuals",
                    "effect": "Pick a visib;le enemy unit within 18\" of your general to be the target, then make a casting roll of 2D6.  Pn a 6+, inflict D3 mortal damage on the the target.  Then, if your Cryptguard unit is within 6\" of the target, you can return 1 slain model to your Cryptguard unit for each damage point allocated by this ability.",
                    "once": onces.none,
                    "phase": phases.hero,
                },],
            "units": ["Abborrant Archregent (Hero)", "Cryptguard (10)", "Morbheg Knights (3)", "Varghulf Courtier (1)"]

        },
        {
            "id": factions.sonsOfBehematWallsmasherStomp,
            "name": "Sons of Behemat - Wallsmasher Stomp",
            "battleTraits": [
                {
                    "id": "bullstomper",
                    "name": "Bull Stomper",
                    "effect": "Your general has the HERO keyword (in addition to the monster keyword)n but does not have the REINFORCEMENTS keyword or icon.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "foeChompers",
                    "name": "Foe-Chompers",
                    "effect": "Each time an enemy model is slain by a friendly unit's Stuff'Em in Me Bag ability, Heal (D3) that uit.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                },
                {
                    "id": "earthShakingCharge",
                    "name": "Earth-shaking Charge",
                    "effect": "Pick a friendly unit that charged this phase to use this ability, then roll a dice for each enemy unit in combat with it.  On a 3+, that enemy unit has STRIKE-LAST this turn.",
                    "once": onces.phase,
                    "phase": phases.charge,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "monstrouslyTough",
                    "name": "Monstrously Tough",
                    "effect": "Your general has a Health characterisic of 15 instead of 12.",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "extraBigBag",
                    "name": "Extra-Big Bag",
                    "effect": "When your general uses their Stuff Em inMe Bag ability, you can pick 2 enemy units instead of 1 (roll for each)",
                    "once": onces.none,
                    "phase": phases.passive,
                },
                {
                    "id": "lankyGit",
                    "name": "Lanky Git",
                    "effect": "When you make a charge roll for your general, roll 3D6, instead of 2D6.",
                    "once": onces.none,
                    "phase": phases.charge,
                },
                {
                    "id": "furiouslyTerritorial",
                    "name": "Furiously Territorial",
                    "effect": "Add 1 to hit rolls for attacks made by your general that target an enemy unit that is contesting an objective you do not control.",
                    "once": onces.none,
                    "phase": phases.passive,
                },],
            "units": ["Mancrusher Gargant (Hero)", "Mancrusher Gargant (1)", "Mancrusher Gargant (1)"]

        },
        {
            "id": factions.hedonitesOfSlaaneshBladeOfTheLuridDream,
            "name": "Hedonites of Slaanesh - Blades of the Lurid Dream",
            "battleTraits": [
                {
                    "id": "temptationsOfSlaanesh",
                    "name": "Temptation of Slaanesh",
                    "effect": "You receieve 6 temptation dice at the start of the battle round.  Each time your opponent makes a failed hit roll, a failed wound roll or a failed save roll, you can offer than a temptation dice.  If they accept your offer, that roll is replaced with a 6.  Rolls replaced in this way cannot be re-rolled or modified.  Each time your opponent accepts your offer of a temptation dice, you gain D6 depravity points.  Each time your opponent rejects your offer of a temptation dice, inflict D3 mortal damage on the unit for which the roll was made.  You cannot offer your opponent a temptatin dice for the same enemy unit more than once per phase.  At the end of the battle round, all remaining temptation dice are lost.  All friendly unit gain passive abilities from the table below based on the number of depravity points you have.  These abilities are cumulative.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.table,
                    
                }
            ],
            "regimentAbilities": [
                {
                    "id": "unparalledSpeed",
                    "name": "Unparalleled Speed",
                    "effect": "Pick a friendly unit to use this ability.  That unit has STRIKE-FIRST this phae.",
                    "once": onces.battle,
                    "phase": phases.anycombat,
                    "tags": [],
                },
                {
                    "id": "locusOfDiversion",
                    "name": "Locus Of Diversion",
                    "effect": "Pick a friendly unit to use this ability.  For the rest of the turn, that unit can use a RETREAT ability and still use a SHOOT ability and/or CHARGE abilities late in the turn.",
                    "once": onces.turn,
                    "phase": phases.movement,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                    "id": "sceptreOfDomination",
                    "name": "Sceptre of Domination",
                    "effect": "Roll a dice for each enemy unit in combt with your general.  On a 5+, the unit being rolled for has STRIKE-LAST this phase.",
                    "once": onces.none,
                    "phase": phases.anycombat,
                },
                {
                    "id": "twistedMirror",
                    "name": "Twisted Mirror",
                    "effect": "Pick an enemy unit within 9\" of your general and roll a dice.  On a 4+, subtract 1 from save rolls for that unit untio the start of your next turn.",
                    "once": onces.turn,
                    "phase": phases.shooting,
                },
                {
                    "id": "cacophonicChoir",
                    "name": "Cacophonic Choir",
                    "effect": "Make a casting roll of 2D6.  On a 6+, ake a cacophony roll of D6.  Inflict D3 mortal damage on each enemy unit (roll for each) within 6\" of your general that has a Control characteristic less than the cacophony roll.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
                {
                    "id": "pendantOfSlaanesh",
                    "name": "Pendant of Slaanesh",
                    "effect": "Heal (D3) your general.",
                    "once": onces.none,
                    "phase": phases.hero,
                },
            ],
            "units": ["Shardspeaker of Slaanesh (Hero)", "Blissbarb Archers with 1 Blissbrew Homonculus (5)", "Blissbarb Archers (5)", "Slickblade Seekers (5)", "Slaangor Fiendbloods (3)"]

        },
        {
            "id": factions.bladesOfKhorneBloodboundGorePilgrims,
            "name": "Blades of Khorne - Bloodbound Gore Pilgrims",
            "battleTraits": [
            {
                    "id": "bloodTraits",
                    "name": "Blood Traits",
                    "effect": "The 3 abilities are available for the battle.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
            }
            ],
            "regimentAbilities": [
                {
                    "id": "favouredOfKhorne",
                    "name": "Favoured of Khorne",
                    "effect": "Roll a dice.  On a 2+, you recieve 1 blood tithe point.",
                    "once": onces.turn,
                    "phase": phases.start,
                    "tags": [],
                },
                {
                "id": "bloodwokenRunies",
                    "name": "Blood-woken Ruins",
                    "effect": "Friendly unit have Ward (5+) if they have used a FIGHT ability in the same phase.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                        "id": "resanguination",
                        "name": "Resanguination",
                        "effect": "Pick a visible friendly unit wholly within 16\" of your general, then make a chanting roll of D6.  On a 3+, Heal (D3) that unit.",
                        "once": onces.none,
                        "phase": phases.hero,
                    },
                    {
                        "id": "theCrimsonPlate",
                        "name": "The Crimson Plate",
                        "effect": "Your general has Ward 5+",
                        "once": onces.none,
                        "phase": phases.passive,
                    },
                    {
                        "id": "headhunter",
                        "name": "Headhunter",
                        "effect": "Pick an enemy HERO in combat with your general.  Your general has STRIKE-FIRST this phase, but all attacks made by them this phase must target that enemy HERO.",
                       "once": onces.none,
                       "phase": phases.anycombat,
                    },
                    {
                        "id": "unholyFlames",
                        "name": "Unholy Flames",
                        "effect": "Pick a visible friendly unit wholly within 16\" of your general, then make a chanting roll of D6.  On a 4+, add 1 to the Rend characteristic of that unit's melee weapons until the start of your next turn.",
                        "once": onces.none,
                        "phase": phases.hero,
                    },],
            "units": ["Slaughterpriest (Hero)", "Blood Warriors (5)", "Blood Warriors (5)", "Bloodreavers (10)", "Mighty Skullcrushers (3)"]
            
        }, 
        {
            "id": factions.ossiarchBonereapersTitheReaperEchelon,
            "name": "Ossiarch Bonereapers - Tithe-Reaper Echelon",
            "battleTraits": [
            {
                    "id": "reserveContingent",
                    "name": "Reserve Contingent",
                    "effect": "One of your Mortek Guard unit is not set up during the deployment phase.  Instead, from the thrd battle round onwards, it can use the follow ability.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    "dialog": {
                    
                            "id": "ossiarchCommand",
                            "name": "Ossiarch Commands",
                            "effect": "At the start of the battle round, you recieve 2 Oassiarch command points.  Each Ossirach Command costs 1 Ossiarch command point to use.  The same unit cannot use more than one Ossiarch Command in the same plase.  At the end of the battle round, all remaining Ossiarch command points are lost.",
                    }
            }
            ],
            "regimentAbilities": [
                {
                    "id": "impenetrableRanks",
                    "name": "Impenetrable Ranks",
                    "effect": "Pick a friendly unit to use this ability.  Unit the end of the phase, add 1 to ward rolls for that unit.",
                    "once": onces.battle,
                    "phase": phases.combat,
                    "tags": ["ossiarchCommand"],
                },
                {
                "id": "reformRanks",
                    "name": "Re-Form Ranks",
                    "effect": "Pick a friendly Mortek Guard unit in combat to use this ability.  That unit can use a RETREAT ability this phase without any mortal damage being inflicted on it.",
                    "once": onces.battle,
                    "phase": phases.movement,
                    "tags": ["ossiarchCommand"],
                }
            ],
            "enhancements": [
                {
                        "id": "empowerNairiteWeapons",
                        "name": "Empowered Badirite Weapons",
                        "effect": "Pick a visible friendly Mortek Guard unit wholly within 12\" of your general, then make a casting role of 2D6.  On a 5+, until the start of your next turn, add 1 to the Rend characteristic of this unit's melee weapon.",
                        "once": onces.none,
                        "phase": phases.hero,
                    },
                    {
                        "id": "unstoppableCommander",
                        "name": "Unstoppable Commander",
                        "effect": "Pick a friendly, Mortek Guard unit wholly within 12\" of your general, then roll a dice.  On a 2+, add 3\" to that unit's Move characteristic this phase.",
                        "once": onces.none,
                        "phase": phases.movement,
                    },
                    {
                        "id": "murderousDrive",
                        "name": "Murderous Drive",
                        "effect": "Your general's Soulreaper Scytge has Crit (2 Hits)",
                       "once": onces.none,
                       "phase": phases.passive,
                    },
                    {
                        "id": "marrowpact",
                        "name": "Marrowpact",
                        "effect": "Each time your general uses a FIGHT ability after all of their attacks have been resolve.  Heal (X) your general where X is the number of damage points allocated by those attacks.",
                        "once": onces.none,
                        "phase": phases.passive,
                    },],
            "units": ["Mortisan Soulreaper (Hero)", "Mortek Guard (10)", "Mortek Guard (10)", "Kavalos Deathriders (5)", "Gothizzar Harvester (1)"]
            
        }, 
       {
            "id": factions.sylvanethBitterbarkCopse,
            "name": "Sylvaneth - Bitterbark Copse",
            "battleTraits": [
            {
                    "id": "sylvanetBattleTrait",
                    "name": "Sylvaneth Battle Traits",
                    "effect": "Each of these can be used once per turn, at tne end of any turn. ",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
            }
            ],
            "regimentAbilities": [
                {   
                    "id": "vengefulSpiritsOfTheLand",
                    "name": "Vengeful Spirits of the Land",
                    "effect": "Once per trun, end of any turn.  Pick an enemy unit that is contesting an objective and roll a dice.  On a 4+, inflict D3 mortal damage on that enemy unit.",
                    "once": onces.turn,
                    "phase": phases.end,
                    "tags": [],
                },
                {
                "id": "walkersOfTheHiddenPaths",
                    "name": "Walkers of the Hidden Paths",
                    "effect": "Pick a friendly unit that is within 3\" of any terrain features and not on combat.  Remove that unit from the battlefield and set it up again more that 6\" from all enemy units.  That unit cannot use MOVE abilities for the rest of the phase.",
                    "once": onces.turn,
                    "phase": phases.movement,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                        "id": "regrowth",
                        "name": "Regrowth",
                        "effect": "Pick a visible friendly unit wholly within 18\" of your general to be the target, then make a casting roll of 2D6.  On a 5+, Heal (D6) the target",
                        "once": onces.none,
                        "phase": phases.hero,
                    },
                    {
                        "id": "gnarledWarrior",
                        "name": "Gnarled Warrior",
                        "effect": "Ignore negative modifiers to save rolls for your general.",
                        "once": onces.none,
                        "phase": phases.passive,
                    },
                    {
                        "id": "treesong",
                        "name": "Treesong",
                        "effect": "Pick a visible friendly unit wholly within 12\" of your general to be the target, then make a casting roll of 2D6.  On a 7+, add 1 to the Rend characteristic of the target unit's melee weapons until the start of your next turn.",
                        "once": onces.none,
                        "phase": phases.hero,
                    },
                    {
                        "id": "seedOfRebirth",
                        "name": "Seed of Rebirth",
                        "effect": "If your general would be destroyed, before removing them from play, roll a dice.  On a 3+, your generial is not destroyed and any remaining damage points inflicted on them have no effect.  Then Heal (1) your general.  This unit cannot use this ability again for the rest of the battle.",
                        "once": onces.none,
                        "phase": phases.passive,
                    },],
            "units": ["Branchwych (Hero)", "Treelord (1)", "Kurnoth Hunters (3)", "Tree-Revenants (5)"]

        }, 
        {
            "id": factions.ogorMawTribesTyrantsBellow,
            "name": "Ogor Maw Tribes - Tyrants Bellow",
            "battleTraits": [
            {
                    "id": "onTheMawpath",
                    "name": "On the Mawpath",
                    "effect": "Your Ironblaster and Mournfang Pack unit are not set up during the deployment phase.  Instead, from the the third battle round onwards,, they can use the follow ability.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "special": battleTraitSpecials.multiple,
                    
            }
            ],
            "regimentAbilities": [
                {
                    "id": "pulverisingGirth",
                    "name": "Pulverising Girth",
                    "effect": "Pick any number of friendly units that charged this phase.  For each of those units, pick an enemy unit in combat with it and roll a dice.  On a 4+ inflict 1 mortal damage on that enemy unit.",
                    "once": onces.phase,
                    "phase": phases.charge,
                    "tags": [],
                },
                {
                "id": "bredForToughness",
                    "name": "Bred for Toughness",
                    "effect": "Add 1 to health characterstic of your Ironblaster and your Mournfang Pack unit.",
                    "once": onces.none,
                    "phase": phases.passive,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                        "id": "longstrider",
                        "name": "Longstrider",
                        "effect": "Your general has a Move of 8\" instead of 6\".",
                        "once": onces.none,
                        "phase": phases.passive,
                    },
                    {
                        "id": "flaskOfStonehornBlood",
                        "name": "Flask of Stonehorn Blood",
                        "effect": "Reaction to an attack.  Your general has a Ward (3+) this phase.",
                        "once": onces.battle,
                        "phase": phases.anycombat,
                    },
                    {
                        "id": "boomingRoar",
                        "name": "Booming Roar",
                        "effect": "Roll a dice.  On a 4+, subtrat 1 from hit rolls for attacks made by enemy units this phase while they are within 9\" of your general.",
                       "once": onces.none,
                       "phase": phases.anycombat,
                    },
                    {
                        "id": "blubbergryb",
                        "name": "Blubbergrub",
                        "effect": "Pick either your Ironblaster or your Mournfang Pack unit if it is within your general's combat range.  Heal (D6) that unit.",
                        "once": onces.battle,
                        "phase": phases.movement,
                    },],
            "units": ["Tyrant (Hero)", "Mournfang Pack (2)", "Ogor Gluttons (3)", "Ogor Gluttons (3)", "Leadbelchers (4)", "Ironblaster (1)"]
            
        },
        {
            "id": factions.citiesOfSigmarCasteliteCompany,
            "name": "Cities of Sigmar - Castelite Company",
            "battleTraits": [
            {
                    "id": "theOfficarOrder",
                    "name": "The Officar's Order",
                    "effect": "Pick a battle tactic card in your hand and place it face-down separetly next to your other battle tactic cards.  The information on it is still hideen from your opponent but make it clear which card is separte.  The card stays separate until you use the command on it or score the battle tactic on it as described below.  When you use the command on that card, it is not discard but returns to your hand.  Your opponent can check the information on it before it returns to your hand.  The card goes back to being a normal battle tactic card, with the exception that you cannot use the command on it in the same phase it went back into your hand.  If you did not use the command on the card you you separated, you can still score the battle tactic on it at the end of your turn as normal if you met its conditions.  If you do so, discard it as normal.  If you neither used the command nor scored the battle tactic on the card, it automatically returns to your hand at the end of your turn.  Design's Note:  This ability essentially lets you use a command 'for free' but you have to choose the command at the start of the battle so it requires some planning ahead!",
                    "once": onces.battle,
                    "phase": phases.start,
                    "special": battleTraitSpecials.none,
                    
            }
            ],
            "regimentAbilities": [
                {
                    "id": "forSigmarCharge",
                    "name": "For Sigmar, Charge",
                    "effect": "Use this ability before any CHARGE abilities are used this phase.  Friendly CAVALRY units that charge this phase have STRIKE-FIRST this turn.",
                    "once": onces.battle,
                    "phase": phases.charge,
                    "tags": [],
                },
                {
                "id": "ironweldDiscipline",
                    "name": "Ironweld Discipline",
                    "effect": "Pick your Ironweld Great Cannon to use this ability.  It can use the SHOOT ability as if it were your shooting phase.",
                    "once": onces.battle,
                    "phase": phases.shooting,
                    "tags": [],
                }
            ],
            "enhancements": [
                {
                        "id": "flaskOfLethisianDarkwater",
                        "name": "Flask of Lethisian Darkwater",
                        "effect": "Heal (D6) your general.",
                        "once": onces.battle,
                        "phase": phases.start,
                    },
                    {
                        "id": "heriloomBlade",
                        "name": "Heirloom Blade",
                        "effect": "Add 1 to the Rend characteristic of your generla's Master-forged Longsword.",
                        "once": onces.none,
                        "phase": phases.passive,
                    },
                    {
                        "id": "brazierOfHolyFlame",
                        "name": "Brazier of Holy Flame",
                        "effect": "Pick a friendly Freeguild Steelhelms unit within your general’s combat range. Effect: You can return up to d3 models to that unit.",
                       "once": onces.none,
                       "phase": phases.end,
                    },
                    {
                        "id": "glimmering",
                        "name": "Glimmering",
                        "effect": "Each phase, you can re-roll 1 hit roll or wound roll or 1 save roll made for your general.",
                        "once": onces.none,
                        "phase": phases.passive,
                    },],
            "units": ["Freeguild Cavalier-Marshal (Hero)", "Freeguild Steelhelms (10)", "Freeguild Cavaliers (5)", "Ironweld Great Cannon (1)"]
            
        }, 
    ]
};


