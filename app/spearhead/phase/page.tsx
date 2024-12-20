"use client"

import { useSearchParams } from "next/navigation";
import { Ability, getAttacksForRound, Unit, Units } from "../units";
import { BattleTrait, battleTraitSpecials, Enhancement, Faction, Factions, onces, RegimentAbilitiy } from "@/app/shared/factions";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { renderBattleTraitCard, renderAbilityCard, renderPhaseCard, renderUnitCard } from './render-card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselFirst,
} from "@/components/ui/carousel"
import VictoryPointTracker from "./victory-points";
import { Home } from "../navigation";
import DialogCommandAbilities from "./special-battle-tactics/dialog";
import { isCombatPhase, showAbility, showEnhancement, showEnhancementOnCombatPhase } from "./utils";
import Donations from "./donation";
import PlayerCards from "./player-cards";
import { Phase, phases } from "../../shared/phase";
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";




//Primary Method *************
export default function StartOfRoundPage() {

  //Scroll to top of page when the page is loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [round, setRound] = useState(1)



  const params = useSearchParams();
  const passedFaction = params.get('faction') || '0';
  const passedUseCards = params.get('usecards') || true;
  const selectedFactionId = parseInt(passedFaction);
  const usecards = (passedUseCards === 'true')

  const faction = Factions.factions.find(faction => faction.id === selectedFactionId) as Faction;

  const initialBattleTrait = params.get('battleTraits');
  const battleTraits = faction?.battleTraits || [];
  const selectedBattleTrait = battleTraits.find(trait => trait.id === initialBattleTrait) as BattleTrait;

  const initialRegimentAbility = params.get('regimentAbilities');
  const regimentAbilities = faction?.regimentAbilities || [];
  const selectedRegimentAbility = regimentAbilities.find(ability => ability.id === initialRegimentAbility) as RegimentAbilitiy;

  const initialEnhancement = params.get('enhancements');
  const enhancements = faction?.enhancements || [];
  const selectedEnhancement = enhancements.find(enhancement => enhancement.id === initialEnhancement) as Enhancement;
  const [usedAbilities, setUsedAbilities] = useState<Set<string>>(new Set())

  /** FUNCTIONS TO HANDLE ACTIONS **/

  //Mark card as used visuabilly for cards that can only be used once per battle
  const handleAbilityClick = (unitId: string, once: boolean) => {
    if (!once) return;
    setUsedAbilities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet

    })
  }

  //Button to draw cards to 3 when on the start phase.  
  const [redrawCards, setRedrawCards] = useState<(() => void) | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleRedrawReady = useCallback((redrawFunction: () => void) => {
    setRedrawCards(() => redrawFunction);
  }, []);

  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);

  const handleOpenDialog = (content: React.ReactNode) => {
    setDialogContent(content);
  };

  const nextRoundClick = () => {
    if (redrawCards) {
      redrawCards();
    }

  };

  const handleRoundIncrement = () => {
    if (round < 4) {
      setRound(round + 1)
    } else {
      setShowDonateModal(true)
    }
  }

  const handleNextRound = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmNextRound = (confirm: boolean) => {
    setShowConfirmDialog(false);
    if (confirm) {
      handleRoundIncrement();
      if (redrawCards) {
        redrawCards();
      }
    }
  };

  const [selectedAbilities, setSelectedAbilities] = useState<Ability[]>([]);

  const handleAbilitiesSubmit = (submittedAbilities: Ability[]) => {
    setSelectedAbilities(submittedAbilities);
  };
  /*********************************/

  //Logiic initially shufftle and draw cards to 3.  Also checks to make sure it only happens once.
  const initializedRef = useRef(false);
  useEffect(() => {

    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, []);

  const renderAbilityCardWrapper = (item: any, skipCommands: boolean = true) =>
    renderAbilityCard(item, usedAbilities, handleAbilityClick, skipCommands);

  const renderUnitCardWrapper = (phase: Phase, unit: any) =>
    renderUnitCard(phase, unit, selectedEnhancement, selectedFactionId, renderAbilityCardWrapper);


  const [showDonateModal, setShowDonateModal] = useState(false)
  /********************************** */



  //Start of HTML
  return (

    <div className=" mx-auto ">
      {/* Cards */}
      <PlayerCards
        usecards={usecards}
        onRedrawReady={handleRedrawReady}
        onOpenDialog={handleOpenDialog}
      />
      <Carousel className="w-full relative">



        <CarouselContent>



          {Phase.phases.map(selectedPhase => (
            <CarouselItem key={selectedPhase.id} className={`${selectedPhase?.bgcolor} text-white min-h-screen w-full p-4 sm:p-6 lg:p-8`}>

              {/* Header:  Phase Name, Round counter, and navigation to advance phase */}
              <section className="w-full  mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl font-semibold">{selectedPhase?.name}</h1>
                  Round: {round}
                  <div className="flex items-center space-x-2">
                    <CarouselPrevious />
                    <CarouselNext />
                  </div>
                </div>
              </section>


              <Donations isOpen={showDonateModal} onOpenChange={setShowDonateModal} />



              {/* Next Round Button and VP counter that should only be shwon on End Phase */}
              {selectedPhase.id === phases.end && (

                <div>
                  <VictoryPointTracker />
                  <div className="flex justify-center items-center w-full mt-4">
                    <CarouselFirst
                      onClick={handleNextRound}
                      className="cursor-pointer hover:bg-gray-200"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2" />

              <div className="space-y-6 p-6">




                {/* Battle Traits */}
                {selectedBattleTrait && showAbility(selectedPhase, selectedBattleTrait) && (
                  <section className="w-full mx-auto">
                    <Accordion type="single" collapsible defaultValue="battle-traits">
                      <AccordionItem value="battle-traits">
                        <AccordionTrigger>
                          <h2 className="text-xl font-semibold">Battle Traits <span className="text-xs">(Click to colapse/expand)</span></h2>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {renderBattleTraitCard(faction?.id || 0, selectedBattleTrait, selectedPhase, renderAbilityCardWrapper)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </section>
                )}

                {/* Regiment Abilities */}
                {selectedRegimentAbility && showAbility(selectedPhase, selectedRegimentAbility) && (
                  <section className="w-full mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Regiment Ability</h2>
                    <div className="space-y-4">
                      {renderAbilityCardWrapper(selectedRegimentAbility)}
                    </div>
                  </section>
                )}

                {/* Enhancements */}
                {selectedEnhancement && showEnhancement(selectedPhase, selectedEnhancement) && (
                  <section className="w-full mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Enhancements</h2>
                    <div className="space-y-4">
                      {renderAbilityCardWrapper(selectedEnhancement)}
                    </div>
                  </section>
                )}



                {selectedAbilities.length > 0 && (
                  <section className="w-full mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Selected Abilities</h2>
                    <div className="space-y-4">
                      {selectedAbilities.map(ability => ability.phase === selectedPhase.id ? renderAbilityCardWrapper(ability, false) : null)}
                    </div>
                  </section>


                )}

                {renderPhaseCard(selectedPhase, selectedFactionId, renderUnitCardWrapper)}



              </div>

              <DialogCommandAbilities
                selectedFactionId={selectedFactionId}
                selectedPhase={selectedPhase}
                selectedBattleTrait={selectedBattleTrait}
                selectedRegimentAbility={selectedRegimentAbility}
                onSubmit={handleAbilitiesSubmit}
              />



            </CarouselItem>
          ))}


        </CarouselContent>
      </Carousel>

      <section className="w-full mx-auto flex justify-center items-center">
        <div className="flex justify-center items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-500">
            <Home />
          </h1>
        </div>
      </section>

      <Dialog open={dialogContent !== null} onOpenChange={() => setDialogContent(null)}>
        <DialogOverlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="fixed z-50 grid w-full max-w-lg scale-100 gap-4 border bg-white p-6 shadow-lg sm:rounded-lg md:w-full top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] text-gray-900">
          {dialogContent}
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={() => setShowConfirmDialog(false)}>
        <DialogOverlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="fixed z-50 grid w-full max-w-lg scale-100 gap-4 border bg-white p-6 shadow-lg sm:rounded-lg md:w-full top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] text-gray-900">
          <h2 className="text-lg font-semibold">Seizing the Initative</h2>
          <p>If the player who went second in the previous battle round wins the priority roll and chooses to go first, it is called seizing the initative.  When a player seizes the initative, they do not draw any battle tactic cards for that battle round unles they are the underdog and the difference in victory points between the two players is 5 or greater.</p>
          <p>Do want to redraw cards back up to 3?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleConfirmNextRound(false)}>No</Button>
            <Button onClick={() => handleConfirmNextRound(true)}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );


}
