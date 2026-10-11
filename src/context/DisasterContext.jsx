import React, { createContext, useContext, useState } from 'react';

const INITIAL_DISASTERS = [
  {
    id: "DISASTER-001",
    name: "Assam Flood Response",
    type: "Flood",
    region: "Morigaon, Assam",
    startTime: "2026-10-06T04:30:00Z",
    status: "Active",
    isSimulated: true
  },
  {
    id: "DISASTER-002",
    name: "Barpeta Flash Flood",
    type: "Flood",
    region: "Barpeta, Assam",
    startTime: "2026-10-08T10:00:00Z",
    status: "Active",
    isSimulated: true
  }
];

const DisasterContext = createContext(null);

export function DisasterProvider({ children }) {
  const [disasters, setDisasters] = useState(INITIAL_DISASTERS);
  const [currentDisaster, setCurrentDisaster] = useState(INITIAL_DISASTERS[0]);

  const createDisaster = (disasterData) => {
    const newId = `DISASTER-${String(disasters.length + 1).padStart(3, '0')}`;
    const newDisaster = {
      id: newId,
      name: disasterData.name.trim(),
      type: disasterData.type,
      region: disasterData.region.trim(),
      startTime: disasterData.startTime,
      status: disasterData.status || "Active",
      isSimulated: true
    };

    setDisasters((prev) => [newDisaster, ...prev]);
    setCurrentDisaster(newDisaster);
    return newDisaster;
  };

  const selectDisaster = (id) => {
    const found = disasters.find((d) => d.id === id);
    if (found) {
      setCurrentDisaster(found);
    }
  };

  return (
    <DisasterContext.Provider
      value={{
        disasters,
        currentDisaster,
        createDisaster,
        selectDisaster,
        setCurrentDisaster
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
}

export function useDisaster() {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
}

export default DisasterContext;
