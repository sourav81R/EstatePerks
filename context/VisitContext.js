import { createContext, useContext, useState } from 'react';

const VisitContext = createContext(null);

export function VisitProvider({ children }) {
  const [visits, setVisits] = useState([]);
  const [points, setPoints] = useState(0);

  const addVisit = (visit) => {
    setVisits((prev) => [...prev, visit]);
    setPoints((prev) => prev + 10);
  };

  return (
    <VisitContext.Provider value={{ visits, points, addVisit }}>
      {children}
    </VisitContext.Provider>
  );
}

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) {
    throw new Error('useVisit must be used inside VisitProvider');
  }
  return ctx;
}
