import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';

interface MayaContextData {
  currentPage: string;
  currentProduct: any | null;
  setCurrentProduct: (p: any | null) => void;
  pendingAction: any | null;
  setPendingAction: (a: any | null) => void;
}

const MayaContext = createContext<MayaContextData>({
  currentPage: '/',
  currentProduct: null,
  setCurrentProduct: () => {},
  pendingAction: null,
  setPendingAction: () => {},
});

export function MayaProvider({ children }: { children: ReactNode }) {
  const [currentProduct, setCurrentProduct] = useState<any | null>(null);
  const [pendingAction, setPendingAction] = useState<any | null>(null);
  const [location] = useLocation();

  return (
    <MayaContext.Provider
      value={{
        currentPage: location,
        currentProduct,
        setCurrentProduct,
        pendingAction,
        setPendingAction,
      }}
    >
      {children}
    </MayaContext.Provider>
  );
}

export const useMaya = () => useContext(MayaContext);
