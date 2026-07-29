import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface OverlayContextType {
  isOverlayActive: boolean;
  registerOverlay: (id: string) => void;
  unregisterOverlay: (id: string) => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());

  const registerOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unregisterOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isOverlayActive = activeOverlays.size > 0;

  return (
    <OverlayContext.Provider value={{ isOverlayActive, registerOverlay, unregisterOverlay }}>
      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
};

/**
 * Custom hook to register/unregister an overlay based on its active state and lifecycle.
 */
export function useRegisterOverlay(id: string, active: boolean) {
  const { registerOverlay, unregisterOverlay } = useOverlay();

  useEffect(() => {
    if (active) {
      registerOverlay(id);
      return () => {
        unregisterOverlay(id);
      };
    }
  }, [id, active, registerOverlay, unregisterOverlay]);
}

/**
 * Centralized polling helper that decides the active query polling interval.
 * Returns false (to pause polling) if the tab is hidden or if a blocking overlay is active.
 */
export function getPollingInterval(isOverlayActive: boolean, baseInterval: number = 5000): number | false {
  return isOverlayActive ? false : baseInterval;
}
