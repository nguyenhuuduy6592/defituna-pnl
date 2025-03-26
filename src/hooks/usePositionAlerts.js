import { useState, useEffect } from 'react';

export const usePositionAlerts = (positions, solPrice) => {
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    apyThreshold: 5,
    utilizationThreshold: 10,
    priceThreshold: 3,
    enabled: true
  });

  // Load settings from localStorage in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('alertSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  }, []);

  // Load previous position states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStates = localStorage.getItem('positionStates');
      if (savedStates) {
        const states = JSON.parse(savedStates);
        checkForAlerts(positions, states);
      }
      // Save current states
      if (positions) {
        localStorage.setItem('positionStates', JSON.stringify(
          positions.map(p => ({
            pair: p.pair,
            state: p.state,
            yield: p.yield,
            debt: p.debt,
            pnl: p.pnl
          }))
        ));
      }
    }
  }, [positions]);

  // Save settings when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('alertSettings', JSON.stringify(settings));
    }
  }, [settings]);

  const checkForAlerts = (currentPositions, previousStates) => {
    if (!currentPositions || !previousStates || !settings.enabled) return;

    const newAlerts = [];
    currentPositions.forEach(current => {
      const previous = previousStates.find(p => p.pair === current.pair);
      if (!previous) return;

      // Check for significant yield changes
      const yieldChange = Math.abs(
        ((current.yield - previous.yield) / previous.yield) * 100
      );
      if (yieldChange >= settings.apyThreshold) {
        newAlerts.push({
          id: Date.now() + Math.random(),
          type: 'yield',
          pair: current.pair,
          message: `Yield changed by ${yieldChange.toFixed(2)}% for ${current.pair}`,
          timestamp: new Date()
        });
      }

      // Check for significant PnL changes
      const pnlChange = Math.abs(
        ((current.pnl - previous.pnl) / previous.pnl) * 100
      );
      if (pnlChange >= settings.priceThreshold) {
        newAlerts.push({
          id: Date.now() + Math.random(),
          type: 'pnl',
          pair: current.pair,
          message: `PnL changed by ${pnlChange.toFixed(2)}% for ${current.pair}`,
          timestamp: new Date()
        });
      }

      // Check for state changes
      if (current.state !== previous.state) {
        newAlerts.push({
          id: Date.now() + Math.random(),
          type: 'state',
          pair: current.pair,
          message: `Position state changed from ${previous.state} to ${current.state} for ${current.pair}`,
          timestamp: new Date()
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    alerts,
    settings,
    updateSettings,
    clearAlerts
  };
};