import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserData {
  name: string;
  phone: string;
  email: string;
}

interface Sponsor {
  id: string;
  name: string;
  city: string;
  logo_url: string;
  prize_description: string;
  phone: string;
  prize_count: number;
}

interface GameContextType {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  selectedSponsor: Sponsor | null;
  setSelectedSponsor: (sponsor: Sponsor) => void;
  totalPoints: number;
  addPoints: (points: number) => void;
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  stagePoints: number[];
  addStagePoints: (stage: number, points: number) => void;
  wheelPoints: number[];
  addWheelPoints: (stage: number, points: number) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [stagePoints, setStagePoints] = useState<number[]>([0, 0, 0, 0, 0]);
  const [wheelPoints, setWheelPoints] = useState<number[]>([0, 0, 0, 0, 0]);

  const addPoints = (points: number) => {
    setTotalPoints(prev => prev + points);
  };

  const addStagePoints = (stage: number, points: number) => {
    setStagePoints(prev => {
      const newPoints = [...prev];
      newPoints[stage] = points;
      return newPoints;
    });
  };

  const addWheelPoints = (stage: number, points: number) => {
    setWheelPoints(prev => {
      const newPoints = [...prev];
      newPoints[stage] = points;
      return newPoints;
    });
  };

  const resetGame = () => {
    setTotalPoints(0);
    setCurrentStage(0);
    setStagePoints([0, 0, 0, 0, 0]);
    setWheelPoints([0, 0, 0, 0, 0]);
  };

  return (
    <GameContext.Provider
      value={{
        userData,
        setUserData,
        selectedSponsor,
        setSelectedSponsor,
        totalPoints,
        addPoints,
        currentStage,
        setCurrentStage,
        stagePoints,
        addStagePoints,
        wheelPoints,
        addWheelPoints,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
