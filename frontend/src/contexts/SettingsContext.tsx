import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  autoRefreshInterval: number;
  setAutoRefreshInterval: (seconds: number) => void;
  enableSimulationSound: boolean;
  toggleSimulationSound: () => void;
  selectedNetworkSlice: string;
  setSelectedNetworkSlice: (slice: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5);
  const [enableSimulationSound, setEnableSimulationSound] = useState<boolean>(false);
  const [selectedNetworkSlice, setSelectedNetworkSlice] = useState<string>('eMBB - Ultra-High Throughput Slice');

  const toggleSimulationSound = () => {
    setEnableSimulationSound((prev) => !prev);
  };

  return (
    <SettingsContext.Provider
      value={{
        autoRefreshInterval,
        setAutoRefreshInterval,
        enableSimulationSound,
        toggleSimulationSound,
        selectedNetworkSlice,
        setSelectedNetworkSlice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
