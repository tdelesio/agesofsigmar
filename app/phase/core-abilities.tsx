import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoreAbilities } from '../core';
import { Ability } from '../units';

interface CoreAbilitiesProps {
  selectedPhase: string;
}

export const CoreAbilitiesComponent: React.FC<CoreAbilitiesProps> = ({ selectedPhase }) => {
  const praiseAbilities = (phase: string): JSX.Element | null => {
    const phaseData = CoreAbilities.phases.find(p => Object.keys(p)[0].toLowerCase() === phase.toLowerCase());
    
    if (!phaseData) {
      return null;
    }

    const abilities = phaseData[Object.keys(phaseData)[0]];

    if (abilities.length === 0) {
      return (
        <Card className="bg-yellow-100 text-yellow-800">
          <CardContent>
            <p>No core abilities available for the {phase} phase. This phase focuses on other aspects of the game!</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {abilities.map((ability: Ability) => (
          <Card key={ability.id} className="bg-white">
            <CardHeader>
              <CardTitle>{ability.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{ability.effect}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="core-abilities">
      <h2 className="text-2xl font-bold mb-4">Core Abilities for {selectedPhase} Phase</h2>
      {praiseAbilities(selectedPhase)}
    </div>
  );
};

