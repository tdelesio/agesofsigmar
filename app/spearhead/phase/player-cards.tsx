import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@radix-ui/react-select";
import { BattleTacticCard, Deck } from "./battle-tactic-deck";
import { Button } from '@/components/ui/button';

interface CardsProps {
  usecards: boolean;
  onRedrawReady: (redrawFunction: () => void) => void;
  onOpenDialog: (content: React.ReactNode) => void;
}

export const PlayerCards: React.FC<CardsProps> = ({ usecards, onRedrawReady, onOpenDialog }) => {
  const [deck, setDeck] = useState<BattleTacticCard[]>([]);
  const [hand, setHand] = useState<BattleTacticCard[]>([]);

  useEffect(() => {
    const shuffledDeck = shuffle([...Deck.cards]);
    setDeck(shuffledDeck);
    setHand(shuffledDeck.splice(0, 3));
  }, []);

  const shuffle = (array: BattleTacticCard[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleCardClick = (index: number) => {
    onOpenDialog(
      <>
        <h2 className="text-lg font-semibold mb-4">Confirm Card Use</h2>
        <p className="mb-4">Are you sure you want to use this card? Be use to add any victory points aquired if battle tactic is completed.</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenDialog(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => {
            setHand(prevHand => {
              const newHand = [...prevHand];
              newHand.splice(index, 1);
              return newHand;
            });
            onOpenDialog(null);
          }}>Use Card</Button>
        </div>
      </>
    );
  };

  const redrawCardsToHand = useCallback(() => {
    if (hand.length < 3 && deck.length > 0) {
      const newCards = deck.slice(0, 3 - hand.length);
      setHand(prevHand => [...prevHand, ...newCards]);
      setDeck(prevDeck => prevDeck.slice(3 - hand.length));
    }
  }, [hand.length, deck]);

  useEffect(() => {
    onRedrawReady(redrawCardsToHand);
  }, [onRedrawReady, redrawCardsToHand]);

  const renderBattleTacticDeckCard = (card: BattleTacticCard, onClick: () => void) => {
    return (
      <div>
        <Accordion type="single" collapsible className="w-full max-w-md overflow-hidden mb-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>{card.name}</AccordionTrigger>
            <AccordionContent>
              <Card className="w-full mx-auto cursor-pointer overflow-hidden" onClick={onClick}>
                <CardHeader>
                  <h3 className="text-lg font-semibold">{card.name}</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {card.battleTacticObjective}
                  <Separator className="my-4 border-2" />
                  <h3 className="text-lg font-semibold">{card.command.name}</h3>
                  <span className="font-medium">Declare:</span> {card.command.usedBy}
                  <Separator />
                  <span className="font-medium">Effect:</span> {card.command.effect}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  if (!usecards) return null;

  return (
    <section className="w-full mx-auto">
    <Accordion type="single" collapsible defaultValue="battle-tactic-cards">
      <AccordionItem value="battle-tactic-cards">
        <AccordionTrigger>
          <h2 className="text-xl font-semibold">Player Battle Tactic Cards</h2>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {hand.map((card, index) => (
              <React.Fragment key={card.id}>
                {renderBattleTacticDeckCard(card, () => handleCardClick(index))}
              </React.Fragment>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  );
};

export default PlayerCards;