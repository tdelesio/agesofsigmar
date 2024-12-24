
"use client"

import React from 'react';
import styled from 'styled-components';
import TurnPhases from './TurnPhases';
import PointsDisplay from './PointsDisplay';
import GlobalStyles from './GlobalStyles';
 
const AppContainer = styled.div`
  display: flex;
  background-color: #f0f0f0;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const App = () => {
  return (
    <>
      <GlobalStyles />
      <AppContainer>
        <TurnPhases />
        <PointsDisplay />
      </AppContainer>
    </>
  );
};

export default App;
