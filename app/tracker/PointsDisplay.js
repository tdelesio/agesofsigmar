
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';


const PointsContainer = styled.div`
  flex-grow: 1;
`;


const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 10px;
`;


const PointsGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
`;


const VictoryPointsGrid = styled.div`
  display: grid;
  grid-template-columns: auto repeat(3, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-top: 20px;
`;


const Label = styled.span`
  font-weight: bold;
  text-align: center;
`;


const PointValue = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
  padding: 5px 15px;
  border-radius: 5px;
`;


const GreenValue = styled.span`
  color: green;
  font-size: 24px;
  font-weight: bold;
`;


const Button = styled.button`
  background-color: #e0e0e0;
  border: none;
  padding: 5px 10px;
  font-size: 18px;
  cursor: pointer;
`;


const Select = styled.select`
  padding: 5px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;


const BattleTacticsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;


const BattleTacticCard = styled.div`
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 15px;
  background-color: #f9f9f9;
`;


const BattleTacticTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
`;


const BattleTacticDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
`;


const battleTactics = [
  "Do not Waiver",
  "Slay the Entourage",
  "Attack on Two Fronts",
  "Take Their Land",
  "Seize the Center",
  "Take the Flanks",
  "Other"
];


const battleTacticsContent = [
  {
    title: "DO NOT WAVER",
    description: "You complete this battle tactic at the end of your turn if 2 or more friendly units fought this turn and no friendly units were destroyed this turn."
  },
  {
    title: "SLAY THE ENTOURAGE",
    description: "Pick a unit in the enemy general's regiment. You complete this battle tactic if that unit is destroyed this turn."
  },
  {
    title: "ATTACK ON TWO FRONTS",
    description: "You complete this battle tactic at the end of your turn if you control 2 or more objectives that you did not control at the start of your turn and at least 1 of those objectives was controlled by your opponent at the start of your turn."
  },
  {
    title: "TAKE THEIR LAND",
    description: "Pick a terrain feature wholly or partially within enemy territory and wholly outside friendly territory. You complete this battle tactic if you control that terrain feature at the end of your turn."
  },
  {
    title: "SEIZE THE CENTRE",
    description: "You complete this battle tactic at the end of your turn if 2 or more friendly units are within 3\" of the centre of the battlefield and are not in combat."
  },
  {
    title: "TAKE THE FLANKS",
    description: "You complete this battle tactic at the end of your turn if you have at least 1 friendly unit within 6\" of each short battlefield edge, none of those units are wholly within friendly territory, and none of those units were set up this turn."
  }
];


const BattleTacticCards = () => (
  <BattleTacticsContainer>
    {battleTacticsContent.map((tactic, index) => (
      <BattleTacticCard key={index}>
        <BattleTacticTitle>{tactic.title}</BattleTacticTitle>
        <BattleTacticDescription>{tactic.description}</BattleTacticDescription>
      </BattleTacticCard>
    ))}
  </BattleTacticsContainer>
);


const PointsDisplay = () => {
  const [commandPoints, setCommandPoints] = useState({ T1: 4, T2: 4 });
  const [victoryPoints, setVictoryPoints] = useState({
    T1: [0, 0, 0, 0, 0],
    T2: [0, 0, 0, 0, 0]
  });
  const [battleTacticsSelection, setBattleTacticsSelection] = useState({
    T1: ["", "", "", "", ""],
    T2: ["", "", "", "", ""]
  });


  const handleCommandPointChange = (team, change) => {
    setCommandPoints(prev => ({
      ...prev,
      [team]: Math.max(0, prev[team] + change)
    }));
  };


  const handleVictoryPointChange = (team, round, change) => {
    setVictoryPoints(prev => ({
      ...prev,
      [team]: prev[team].map((point, index) => 
        index === round ? Math.max(0, point + change) : point
      )
    }));
  };


  const handleBattleTacticChange = (team, round, tactic) => {
    setBattleTacticsSelection(prev => ({
      ...prev,
      [team]: prev[team].map((currentTactic, index) => 
        index === round ? tactic : currentTactic
      )
    }));
  };


  const totalVictoryPoints = useMemo(() => ({
    T1: victoryPoints.T1.reduce((sum, point) => sum + point, 0),
    T2: victoryPoints.T2.reduce((sum, point) => sum + point, 0)
  }), [victoryPoints]);


  return (
    <PointsContainer>
      <SectionTitle>Command Points</SectionTitle>
      <PointsGrid>
        {['T1', 'T2'].map(team => (
          <React.Fragment key={team}>
            <Label>{team}</Label>
            <PointValue>
              <Button onClick={() => handleCommandPointChange(team, -1)}>-</Button>
              <GreenValue>{commandPoints[team]}</GreenValue>
              <Button onClick={() => handleCommandPointChange(team, 1)}>+</Button>
            </PointValue>
            {team === 'T1' && <div></div>}
          </React.Fragment>
        ))}
      </PointsGrid>


      <SectionTitle>Victory Points</SectionTitle>
      <VictoryPointsGrid>
        <Label>Battle Tactic</Label>
        <Label>Team 1 Points</Label>
        <Label>Round</Label>
        <Label>Team 2 Points</Label>
        <Label>Battle Tactic</Label>


        {[0, 1, 2, 3, 4].map(round => (
          <React.Fragment key={round}>
            <Select
              value={battleTacticsSelection.T1[round]}
              onChange={(e) => handleBattleTacticChange('T1', round, e.target.value)}
            >
              <option value="">Select Tactic</option>
              {battleTactics.map(tactic => (
                <option key={tactic} value={tactic}>{tactic}</option>
              ))}
            </Select>
            <PointValue>
              <Button onClick={() => handleVictoryPointChange('T1', round, -1)}>-</Button>
              <GreenValue>{victoryPoints.T1[round]}</GreenValue>
              <Button onClick={() => handleVictoryPointChange('T1', round, 1)}>+</Button>
            </PointValue>
            <Label>{round + 1}</Label>
            <PointValue>
              <Button onClick={() => handleVictoryPointChange('T2', round, -1)}>-</Button>
              <GreenValue>{victoryPoints.T2[round]}</GreenValue>
              <Button onClick={() => handleVictoryPointChange('T2', round, 1)}>+</Button>
            </PointValue>
            <Select
              value={battleTacticsSelection.T2[round]}
              onChange={(e) => handleBattleTacticChange('T2', round, e.target.value)}
            >
              <option value="">Select Tactic</option>
              {battleTactics.map(tactic => (
                <option key={tactic} value={tactic}>{tactic}</option>
              ))}
            </Select>
          </React.Fragment>
        ))}


        <Label>Total</Label>
        <PointValue>
          <GreenValue>{totalVictoryPoints.T1}</GreenValue>
        </PointValue>
        <Label>-</Label>
        <PointValue>
          <GreenValue>{totalVictoryPoints.T2}</GreenValue>
        </PointValue>
        <Label>Total</Label>
      </VictoryPointsGrid>


      <SectionTitle>UNIVERSAL BATTLE TACTICS</SectionTitle>
      <BattleTacticCards />
    </PointsContainer>
  );
};


export default PointsDisplay;