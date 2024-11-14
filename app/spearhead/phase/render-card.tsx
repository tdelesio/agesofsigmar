"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ability, getAttacksForRound, Unit, Units } from "../units";
import { AbilityTable } from "./special-battle-tactics/table"
import { multiples } from "./special-battle-tactics/multiple";
import { isCombatPhase, showAbility, showEnhancement, showEnhancementOnCombatPhase } from "./utils";
import { getAbilityForRound, Phase, phases } from "../phase";
import { BattleTrait, battleTraitSpecials, Enhancement, onces } from "../factions";


export const renderBattleTraitCard = (factionId: number, bt: BattleTrait, phase: Phase, renderAbilityCard: (item: any, skipCommands?: boolean) => JSX.Element | null) => {
  //show battle traits when it is a table
  if (bt.special === battleTraitSpecials.table) {
    return <AbilityTable passedFaction={factionId} description={bt.effect} />
  }
  //show multiple battle traits.  This should be nested hence the extra logic here.
  else if (bt.special === battleTraitSpecials.multiple) {
    const factionAbilities = multiples.factions.find(f => f.faction === factionId)?.abilities || []

    return (
      <div className="space-y-4">

        <Card
          key={bt?.id}
          className={`relative overflow-hidden transition-all duration-300 ease-in-out w-full mx-auto bg-white text-black cursor-pointer hover:shadow-md`}
        >
          <div className={`relative `}>
            <CardHeader>
              <CardTitle>{bt.name} </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs pb-2">{bt.effect}</p>


              {factionAbilities.map((ability) =>

                // ((phase.id === ability?.phase || ability?.phase === phases.passive || showCombat(phase, ability)) && 
                showAbility(phase, ability) &&
                (
                  <React.Fragment key={ability?.id}>
                    {renderAbilityCard(ability)}
                  </React.Fragment>
                )
                //)
              )}
            </CardContent>
          </div>

        </Card>
      </div>
    )

  }
  //show the rest of the none
  else {
    return renderAbilityCard(bt)
  }
}

export const renderAbilityCard = (item: any, usedAbilities: Set<string>, handleAbilityClick: (id: string, once: boolean) => void, skipCommands: boolean = true) => {
  const isUsed = usedAbilities.has(item?.id || '')

  if (item.tags && item.tags.length >0 && skipCommands) {

    return (null);
  }



  return (
    <div className="pb-2" key={item.id}>

      <Card
        key={item?.id}
        className={`relative overflow-hidden transition-all duration-300 ease-in-out w-full mx-auto ${item?.once === onces.turn || item?.once === onces.phase ? 'border-rose-600 border-4' : ''}
          ${isUsed ? 'bg-gray-300 dark:bg-gray-800' : 'bg-white text-black cursor-pointer hover:shadow-md'}`}
        onClick={() => handleAbilityClick(item?.id || '', item?.once === onces.battle || false)}
      >
        <div className={`relative ${isUsed ? 'opacity-50' : ''}`}>
          <CardHeader>
            <CardTitle>{item.name} {item?.once === onces.battle ? "(Once Per Battle)" : ""} {item?.phase === phases.passive ? "(Passive)" : ""} {item?.once === onces.turn ? "(Once per Turn)" : ""}  {item?.once === onces.phase ? "(Once per Phase)" : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item?.effect}</p>
          </CardContent>
        </div>
        {isUsed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-500 dark:text-gray-400 opacity-75 rotate-[-20deg]">
              USED
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}

export const renderPhaseCard = (phase: Phase, selectedFactionId: number, renderUnitCard: (phase: Phase, unit: any) => JSX.Element) => {

  const factionUnits = Units.factions.find(faction => faction.id === selectedFactionId);

  return (
    <section className="w-full  mx-auto">
      <h2 className="text-xl font-semibold mb-4">{phase.name}</h2>
      <div className="space-y-4"></div>
      {factionUnits?.units?.map((unit: any) => (
        renderUnitCard(phase, unit)
      ))}
    </section>
  )
}

export const renderUnitCard = (phase: Phase, unit: any, selectedEnhancement: Enhancement | undefined, selectedFactionId: number, renderAbilityCard: (item: any, skipCommands?: boolean) => JSX.Element | null) => {

  const factionUnits = Units.factions.find(faction => faction.id === selectedFactionId);

  return (

    <section className="w-full  mx-auto" key={unit.id}>

      <div className="space-y-4 pb-2">

        <Card key={unit.id} className="bg-white text-black w-full  overflow-hidden">
          <CardHeader>
            <CardTitle>{unit.name}  <section className="pt-2">
              {unit.keywords.map((keyword: string, index: number) => (<span key={index}>({keyword}) </span>))}
            </section></CardTitle>
            <CardDescription className="border-b-2 border-gray-300 flex justify-between py-2"><span>Health: {unit.health}</span> <span>Save: {unit.save}+</span> <span>Ward: {unit.ward}+</span></CardDescription>
          </CardHeader>



          {/* Combat Round */}
          {isCombatPhase(phase) && (
            <CardContent>
              {getAttacksForRound(unit as Unit, phase.id || 0).map((attr) => (
                <div key={attr.id} className="mb-4 bg-white rounded-lg shadow-md overflow-hidden border-black-100 border-2">
                  <div className="bg-gray-100 px-4 py-2 border-b-2 border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-800">{attr.name}</h3>
                  </div>
                  <div className="p-4">
                    {phase.id === phases.shooting && (
                      <div className="mb-3 bg-blue-100 p-2 rounded border-2 border-blue-300 flex justify-between items-center">
                        <span className="font-semibold">Range:</span>
                        <span className="text-lg font-medium">{attr.range}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div className="bg-green-50 p-2 rounded border-2 border-gray-300 flex justify-between items-center">
                        <span className="font-semibold">Attacks:</span>
                        <span className="text-lg font-medium">{attr.attacks}</span>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded border-2 border-gray-300 flex justify-between items-center">
                        <span className="font-semibold">Hit:</span>
                        <span className="text-lg font-medium">{attr.hit}+</span>
                      </div>
                      <div className="bg-orange-50 p-2 rounded border-2 border-gray-300 flex justify-between items-center">
                        <span className="font-semibold">Wound:</span>
                        <span className="text-lg font-medium">{attr.wound}+</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-2 rounded border-2 border-gray-300 flex justify-between items-center">
                        <span className="font-semibold">Rend:</span>
                        <span className="text-lg font-medium">{attr.rend}</span>
                      </div>
                      <div className="bg-red-100 p-2 rounded border-2 border-gray-300 flex justify-between items-center">
                        <span className="font-semibold">Damage:</span>
                        <span className="text-lg font-medium">{attr.damage}</span>
                      </div>
                    </div>
                    {attr.ability && (
                      <div className="mt-4 bg-blue-100 p-3 rounded-lg border-2 border-red-300">
                        <span className="font-semibold text-red-700">Ability:</span>
                        <p className="mt-1 text-red-600">{attr.ability}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* {getAttacksForRound(unit as Unit, phase.id || 0).map((attr) => (
                    <div key={attr.id} className="grid grid-cols-2 gap-2 text-sm">
                      <div className="border-gray-300 pt-5">Name</div><div className="border-gray-300 pt-5">{attr.name}</div>
                      {phase.id === phases.shooting && (
                        <>
                          <div>Range</div><div>{attr.range}</div>
                        </>
                      )}
                      <div className="border-b-2">Attacks</div><div className="border-b-2">{attr.attacks}</div>
                      <div className="border-b-2">Hit</div><div className="border-b-2">{attr.hit}+</div>
                      <div className="border-b-2">Wound</div><div className="border-b-2">{attr.wound}+</div>
                      <div className="border-b-2">Rend</div><div className="border-b-2">{attr.rend}</div>
                      <div className="border-b-2">Damage</div><div className="border-b-2">{attr.damage}</div>
                      {attr.ability && (
                      <div className="border-b-4 border-red-300">Ability</div>
                      )}
                      {attr.ability && (
                      <div className="border-b-4  border-red-300 "><span className=" font-bold text-red-600 px-2 py-1 rounded">
                      {attr.ability}
                    </span></div>
                    )}
                    </div>
                  ))} */}

              <section className="w-full mx-auto pt-2">
                {/* Display Enhancements for General*/}
                {selectedEnhancement && showEnhancementOnCombatPhase(unit.general, phase, selectedEnhancement) && renderAbilityCard(selectedEnhancement)}
              </section>

              {/* Show Round abilities*/}
              <div className="space-y-4">
                {factionUnits?.units.find(u => u.id === unit.id)
                  ? getAbilityForRound(unit as Unit, phase.id).map(ability =>
                    renderAbilityCard(ability)
                  )
                  : null
                }
              </div>

              {/* Show passive abilities*/}
              {<div className="space-y-4">
                {factionUnits?.units.find(u => u.id === unit.id)
                  ? getAbilityForRound(unit as Unit, phases.passive).map(ability =>
                    renderAbilityCard(ability)
                  )
                  : null
                }
              </div>}

            </CardContent>
          )
          }

          {/* Non-Combat Round */}
          {!isCombatPhase(phase) && phase.id != phases.movement && (
            <CardContent>

              <div className="space-y-4 pb-4" key={unit.id}>
                {
                  getAbilityForRound(unit as Unit, phase.id).map(ability =>
                    renderAbilityCard(ability)

                  )}
              </div>

            </CardContent>
          )}

          {/* Movement Round */}
          {phase.id === phases.movement && (
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="text-xl font-bold">
                Movement: <span className="text-4xl">{unit.move}&quot;</span>
              </div>
              {unit.fly && (
                <div className="text-xl mt-2">
                  (Fly)
                </div>
              )}
            </CardContent>
          )
          }

          {/* End of Round */}
          {phase.id === phases.end && (
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="text-xl font-bold">
                Control Score: <span className="text-4xl">{unit.control}</span>
              </div>
            </CardContent>
          )
          }


        </Card>
      </div>
    </section>
  )
}