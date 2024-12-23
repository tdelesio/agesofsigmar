"use client"


import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import {RadioGroup, Radio} from "@nextui-org/radio";
import { NumberInput } from "@/components/ui/number-input"
 
const phases = [
  { name: "Start of Turn", color: "bg-black text-white" },
  { name: "Hero Phase", color: "bg-yellow-300" },
  { name: "Movement Phase", color: "bg-gray-400" },
  { name: "Shooting Phase", color: "bg-green-500" },
  { name: "Charge Phase", color: "bg-orange-500" },
  { name: "Combat Phase", color: "bg-red-600" },
  { name: "End of Turn", color: "bg-black text-white" },
]




export default function TrackerPage() {
  const [selectedPhase, setSelectedPhase] = useState(phases[0].name)
  const [commandPoints, setCommandPoints] = useState([0, 0, 0, 0]);
  const [victoryPoints, setVictoryPoints] = useState(Array(4).fill(Array(4).fill(0)));


  const handleCommandPointChange = (value: number, index: number) => {
    const newCommandPoints = [...commandPoints];
    newCommandPoints[index] = value;
    setCommandPoints(newCommandPoints);
  };

  const handleVictoryPointChange = (value: number, round: number, player:number) => {
    const newVictoryPoints = [...victoryPoints.map(round => [...round])];
    newVictoryPoints[round][player] = value;
    setVictoryPoints(newVictoryPoints);
  }
  
  return (
    <div className="flex p-4">
      <div className="w-1/4 pr-4"> {/* Left Panel */}
        <h1 className="text-2xl font-bold mb-4">Turn Phase Tracker</h1>
        <RadioGroup value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.name} className={`flex items-center space-x-2 p-2 rounded-lg ${phase.color}`}>
              <Radio value={phase.name} id={phase.name} className="w-6 h-6" />
              <Label htmlFor={phase.name} className="text-lg font-medium">{phase.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="w-3/4"> {/* Right Panel */}
        <div> {/* Command Points Section */}
          <h2 className="text-xl font-bold mb-2">Command Points</h2>
          <div className="flex space-x-4">
            {["P1", "P2", "P3", "P4"].map((player, index) => (
              <div key={player} className="flex flex-col items-center space-y-4">
                <Label htmlFor={`command-${player}`}>{player}</Label>
                <NumberInput id={`command-${player}`} min={0} max={6} value={commandPoints[index]} onChange={(e) => handleCommandPointChange(parseInt(e.target.value), index)} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8"> {/* Victory Points Table */}
          <h2 className="text-xl font-bold mb-2">Victory Points</h2>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-400 px-4 py-2">Round</th>
                {["P1", "P2", "P3", "P4"].map((player) => (
                  <th key={player} className="border border-gray-400 px-4 py-2">{player}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(4).fill(null).map((_, round) => (
                <tr key={round}>
                  <td className="border border-gray-400 px-4 py-2">{round + 1}</td>
                  {["P1", "P2", "P3", "P4"].map((player, playerIndex) => (
                    <td key={player} className="border border-gray-400 px-4 py-2">
                      <NumberInput min={0} max={99} value={victoryPoints[round][playerIndex]} onChange={(e) => handleVictoryPointChange(parseInt(e.target.value), round, playerIndex)} />

                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}