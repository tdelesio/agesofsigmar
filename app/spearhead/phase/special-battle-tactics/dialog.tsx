"use client"

import { BattleTrait, onces, RegimentAbilitiy } from "@/app/shared/factions";
import { convertEnumToString, convertStringToEnum, getAbilityForRound, Phase, phases } from "@/app/shared/phase";
import { Ability, Unit, Units } from "@/app/spearhead/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogDescription, DialogPortal, DialogTitle } from "@radix-ui/react-dialog";
import React, { useState, useCallback, useMemo } from "react";

interface DialogCommandAbilitiesProps {
  selectedFactionId: number;
  selectedPhase: Phase;
  selectedBattleTrait: BattleTrait;
  selectedRegimentAbility: RegimentAbilitiy;
  onSubmit: (selectedAbilities: Ability[]) => void;
}

export default function DialogCommandAbilities({
  selectedFactionId,
  selectedPhase,
  selectedBattleTrait,
  selectedRegimentAbility,
  onSubmit
}: DialogCommandAbilitiesProps) {
  const [selectedAbilities, setSelectedAbilities] = useState<Ability[]>([]);
  const [factionDialog, setShowFactionDialog] = useState(true);

  const factionUnits = useMemo(() => Units.factions.find(faction => faction.id === selectedFactionId), [selectedFactionId]);

  const buildCommandAbilities = useCallback((regimentAbilities: any, factionUnits: any): Ability[] => {
    const commandAbilities: Ability[] = [];
    if (regimentAbilities.tags) {
      commandAbilities.push(regimentAbilities);
    }

    Phase.phases.forEach(phase => {
      factionUnits?.units?.forEach((unit: any) => {
        getAbilityForRound(unit as Unit, phase.id).forEach(ability => {
          if (ability.tags) {
            const abilityWithPhase = {
              ...ability,
              phase: phase.id
            };
            commandAbilities.push(abilityWithPhase);
          }
        });
      });
    });

    return commandAbilities;
  }, []);

  const commandAbilities = useMemo(() => {
    if (factionUnits && selectedRegimentAbility) {
      return buildCommandAbilities(selectedRegimentAbility, factionUnits);
    }
    return [];
  }, [selectedRegimentAbility, factionUnits, buildCommandAbilities]);

  const handleAbilityClick = useCallback((ability: Ability) => {
    setSelectedAbilities(prev => {
      const isSelected = prev.some(a => a.id === ability.id);
      if (isSelected) {
        return prev.filter(a => a.id !== ability.id);
      } else if (prev.length < 2) {
        return [...prev, ability];
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(selectedAbilities);
    setShowFactionDialog(false);
  }, [selectedAbilities, onSubmit]);

  const renderAbilityCard = useCallback((item: Ability) => {
    const isSelected = selectedAbilities.some(a => a.id === item.id);

    return (
      <div className="pb-2" key={item.id}>
        <Card
          className={`relative overflow-hidden transition-all duration-300 ease-in-out w-full mx-auto
            ${isSelected ? 'bg-blue-200 dark:bg-blue-800' : 'bg-white text-black cursor-pointer hover:shadow-md'}`}
          onClick={() => handleAbilityClick(item)}
        >
          <div className={`relative ${isSelected ? 'opacity-100' : ''}`}>
            <CardHeader>
              <CardTitle>{item.name} {item?.once === onces.battle ? "(Once Per Battle)" : ""} <span className="flex items-center space-x-2">Phase: {convertEnumToString(item.phase || 0)}</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 dark:text-gray-400">{item?.effect} </div>
            </CardContent>
          </div>
          {isSelected && (
            <div className="absolute top-2 right-2">
              <span className="text-xl font-bold text-blue-500 dark:text-blue-300">
                ✓
              </span>
            </div>
          )}
        </Card>
      </div>
    );
  }, [selectedAbilities, handleAbilityClick]);

  if (selectedPhase.id !== phases.start || !selectedBattleTrait || !selectedBattleTrait.dialog || commandAbilities.length === 0) {
    return null;
  }

  return (
    <Dialog open={factionDialog} onOpenChange={setShowFactionDialog}>
      <DialogPortal>
        <DialogContent className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBattleTrait.dialog.name}</DialogTitle>
              <DialogDescription>{selectedBattleTrait.dialog.effect}</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {commandAbilities.map(ability => renderAbilityCard(ability))}
            </div>
            <DialogFooter className="mt-6">
              {/* <Button onClick={() => setShowFactionDialog(false)}>Close</Button> */}
              <Button 
                onClick={handleSubmit} 
                disabled={selectedAbilities.length !== 2}
              >
                Submit
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}