"use client"

import { factions } from "@/app/shared/factions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
 
// Importing app.css is css file to add styling
//import "./App.css";
 
export const counters = {
    "factions": [
      {
        "faction": factions.maggotkinOfNurgleBleakHost,
        "label": "Disease",
        "abilities": [
            {
                "id": "diseased",
                "name": "Diseased",
                "effect": "Each time an attack is made by a friendly unit model scores a critical hit, you receive 1 disease point to a maximum of 7.",
                "once": false,
            },
            {
                "id": "nurglesEmrace",
                "name": "Nurgle's Embrace",
                "effect": "Spend any number of disease points.  For each disease point you spend, pick an enemy unit that is in combat with any of your units and roll a dice.  On a 4+, inflict 1 mortal damage on the target. (You can pick the same enemy unit more than once.)",
                "once": false,
            }
        ]
    },
]
}

export type Counter ={
    faction: number;
    label: string;
    abilities: Ability[];
  }

type Ability ={
    id: string;
    name: string;
    effect: string;
    once: boolean;
}

interface CounterProps {
    selectedFaction: number;
  }

 export function BattleTacticCounter({selectedFaction}: CounterProps) {
    //  Counter is a state initialized to 0
    const [counter, setCounter] = useState(0);
 
    // Function is called everytime increment button is clicked
    const handleClick1 = () => {
        // Counter state is incremented
        if (counter < 7) {
        setCounter(counter + 1);
        }
    };
 
    // Function is called everytime decrement button is clicked
    const handleClick2 = () => {
        // Counter state is decremented
        setCounter(counter - 1);
    };

    const faction = counters.factions.find(faction => faction.faction === selectedFaction);
 console.log(faction?.label)
    return (

        

<div className="space-y-4">
       


                <Card
      key={`${selectedFaction}`}
      className={`relative cursor-pointer transition-all duration-300 ease-in-out w-full  overflow-hidden mx-auto bg-white text-black hover:shadow-md`}
    >
      {faction?.abilities.map((ability) => (
        <div key={ability.id}>
          <div className="absolute inset-0 bg-gray-900/5 transition-opacity duration-300 opacity-0" />
          <div className="relative transition-opacity duration-300 opacity-100">
            <CardHeader>
              <CardTitle>{ability.name} {ability.once && <span>(Once Per Battle)</span>}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ability.effect}</p>
            </CardContent>
          </div>
        </div>
      ))}
       
    </Card>

    <Card key="vp-counter" className="bg-white text-black max-w-md overflow-hidden w-full mx-auto">
                  <CardHeader>
                    <CardTitle>{faction?.label} Points</CardTitle>
                    <CardDescription className="flex justify-between py-2"><span><Button  onClick={handleClick2}>- </Button></span><span className="text-lg">{counter}</span><span><Button onClick={handleClick1}>+</Button></span></CardDescription>
                  </CardHeader>
                </Card>
</div>
       
    );
};
 
export default BattleTacticCounter;