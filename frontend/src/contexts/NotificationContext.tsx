import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, NotificationType } from '@/types';

interface NotificationContextType {
  notifications: ToastMessage[];
  addNotification: (title: string, message: string, type?: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastMessage[]>([
    {
      id: 'welcome-sprint0',
      title: 'TrustChain-5G Online',
      message: 'Sprint 0 foundation architecture loaded. Welcome to the Command Center.',
      type: 'info',
      duration: 6000
    },
    {
      id: 'threat-alert-01',
      title: 'ML Shield Active',
      message: 'Random Forest Threat Detector listening on virtual 5G slice interfaces.',
      type: 'success',
      duration: 8000
    }
  ]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback((title: string, message: string, type: NotificationType = 'info', duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, title, message, type, duration };
    setNotifications((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
