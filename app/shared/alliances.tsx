import { factions } from "./factions";


export type Alliance = {
    id: string;
    name: string;
    factions: NVP[];
}

export type NVP = {
    id: number;
    name: string;
}

export const Alliances = {
    "alliances": [
        {
            "id": "order",
            "name": "Order",
            "factions": [
                {
                    "id": factions.citiesOfSigmarCasteliteCompany,
                    "name": "Cities of Sigmar - Castelite Company"
                },
                {
                    "id": factions.daughtersOfKhaineHeartflayerTroupe,
                    "name": "Daughters of Khaine - Heartflayer Troupe"
                  },
                  {
                    "id": factions.fyreslayersSageAxeband,
                    "name": "Fyreslayers - Saga Axeband"
                  },
                  {
                    "id": factions.idonethDeepkinSoulraidHunt,
                    "name": "Idoneth Deepkin - Soulraid Hunt"
                  },
                  {
                    "id": factions.kharadronOverlordsSkyhammerTaskForce,
                    "name": "Kharadron Overlords - Skyhammer Task Force"
                  },
                  {
                    "id": factions.luminethRealmLordsGlitteringPhalanx,
                    "name": "Lumineth Realm-Lords - Glittering Phalanx"
              },
              {
                "id": factions.seraphonStarscaleWarhost,
                "name": "Seraphon - Starscale Warhost"
              },
                {
                    "id" : factions.stormcastVigilantBrotherHood,
                    "name": "Stormcast Eternals - Vigilant Brotherhood"
                 },
                 { 
                    "id": factions.stormcastYndrastra, 
                    "name": "Stormcast Eternals - Yndrastra's Spearhead"
                 },
                 
                  {
                    "id": factions.sylvanethBitterbarkCopse,
                    "name": "Sylvaneth - Bitterbark Copse"
                  },
                  
                  

                ]
        },
        {
            "id": "death",
            "name": "Death",
            "factions": [
                {
                    "id": factions.flesheaterCourtsCarrionRetainers,
                    "name": "Flesh-eater Courts - Carrion Retainers",
                 },
                {
                    "id": factions.nighthauntSlasherHost,
                    "name": "Nighthaunt- Slasher Host"
                 },
                 {
                    "id": factions.ossiarchBonereapersTitheReaperEchelon,
                    "name": "Ossirach Bonereapers - Tithe Reaper Echelon"
                 },
                 {
                    "id": factions.soulblightGravelordsBloodCraveHunt,
                    "name": "Soulblight Gravelords - Bloodcrave Hunt"
                 },
                 
                ]
        },
        {
            "id": "chaos",
            "name": "Chaos",
            "factions": [
                {
                    "id": factions.bladesOfKhorneBloodboundGorePilgrims,
                    "name": "Blades of Khorne - Bloodbound Gore Pilgrims"
                },
                {
                    "id": factions.disciplesOfTzeentchFluxbladeCoven,
                    "name": "Disciples of Tzeentch - Fluxblade Coven"
                 },
                 {
                    "id": factions.hedonitesOfSlaaneshBladeOfTheLuridDream,
                    "name": "Hedonites of Slaanesh - Blades of the Lurid Dream"
                 },
                 {
                    "id": factions.maggotkinOfNurgleBleakHost,
                    "name": "Maggotkin of Nurgle - Bleak Host"
                 },
                {
                    "id": factions.skavenGnawfeastClawPack,
                    "name": "Skaven - Gnawfeast Clawpack",
                 },
                 {
                    "id": factions.skavenWarpSparkClawPack,
                    "name": "Skaven - Warpspark Clawpack",
                 },
                 {
                    "id": factions.slaveToDarknessBloodWindLegion,
                    "name": "Slaves of Darkness - Bloodwind Legion",
                 },
                 
                 
                 
            ]
        },
        {
            "id": "destruction",
            "name": "Destruction",
            "factions": [
                {
                    "id": factions.gloomspiteGitzBadMoonMadmob,
                    "name": "Gloomspite Gitz - Bad Moon Madmob"
                },
                {
                    "id": factions.ogorMawTribesTyrantsBellow,
                    name: "Ogor Mawtribes - Tyrant's Bellow"
                },
                {
                    "id": factions.orrukWarclans,
                    "name": "Orruk Warclans - Swampskulka Gang"
                },
                {
                    "id": factions.sonsOfBehematWallsmasherStomp,
                    "name": "Sons of Behema - Wallsmasher Stomp"
                }
            ]
        },
    ]
}