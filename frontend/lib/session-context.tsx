'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface SessionActivity {
  id: string;
  type: 'chat' | 'lead_search' | 'lead_create' | 'property_search' | 'schedule' | 'status_update' | 'theme_change' | 'action';
  title: string;
  description: string;
  timestamp: Date;
  details?: Record<string, any>;
  icon?: string;
}

interface SessionContextType {
  activities: SessionActivity[];
  addActivity: (activity: Omit<SessionActivity, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  getRecentActivities: (limit: number) => SessionActivity[];
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<SessionActivity[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('session_activities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivities(parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })));
      } catch (e) {
        console.error('Failed to load session history:', e);
      }
    }
  }, []);

  // Save to localStorage whenever activities change
  useEffect(() => {
    localStorage.setItem('session_activities', JSON.stringify(activities));
  }, [activities]);

  const addActivity = useCallback((activity: Omit<SessionActivity, 'id' | 'timestamp'>) => {
    const newActivity: SessionActivity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  const clearHistory = useCallback(() => {
    setActivities([]);
    localStorage.removeItem('session_activities');
  }, []);

  const getRecentActivities = useCallback((limit: number) => {
    return activities.slice(0, limit);
  }, [activities]);

  return (
    <SessionContext.Provider value={{ activities, addActivity, clearHistory, getRecentActivities }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
