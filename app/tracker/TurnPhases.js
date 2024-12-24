
import React, { useState } from 'react';
import styled from 'styled-components';


const PhasesContainer = styled.div`
  width: 200px;
  margin-right: 20px;
`;


const PhaseItem = styled.div`
  padding: 10px;
  color: white;
  font-weight: bold;
  margin-bottom: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;


const YellowDot = styled.span`
  width: 10px;
  height: 10px;
  background-color: yellow;
  border-radius: 50%;
  display: inline-block;
  margin-right: 10px;
`;


const getPhaseColor = (phase) => {
  switch (phase) {
    case 'Start of Turn': return '#000';
    case 'Hero Phase': return '#b8860b';
    case 'Movement Phase': return '#808080';
    case 'Shooting Phase': return '#36454f';
    case 'Charge Phase': return '#d2691e';
    case 'Combat Phase': return '#800000';
    case 'End of Turn': return '#4b0082';
    default: return '#f0f0f0';
  }
};


const TurnPhases = () => {
  const phases = ['Start of Turn', 'Hero Phase', 'Movement Phase', 'Shooting Phase', 'Charge Phase', 'Combat Phase', 'End of Turn'];
  const [activePhase, setActivePhase] = useState(phases[0]);


  const handleClick = (phase) => {
    setActivePhase(phase);
  };


  return (
    <PhasesContainer>
      {phases.map((phase) => (
        <PhaseItem
          key={phase}
          onClick={() => handleClick(phase)}
          style={{ backgroundColor: getPhaseColor(phase) }}
        >
          {activePhase === phase && <YellowDot />}
          {phase}
        </PhaseItem>
      ))}
    </PhasesContainer>
  );
};


export default TurnPhases;