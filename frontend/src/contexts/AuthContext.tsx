import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentRole: UserRole;
  login: (emailOrUsername: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<UserRole, User> = {
  Administrator: {
    id: 'admin-001',
    username: 'admin_cyber',
    email: 'administrator@trustchain5g.org',
    role: 'Administrator',
    department: 'Command & Control Operations',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=admin_cyber'
  },
  Researcher: {
    id: 'res-002',
    username: 'dr_ai_security',
    email: 'researcher@trustchain5g.org',
    role: 'Researcher',
    department: 'Federated Learning & AI Lab',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=dr_ai'
  },
  Viewer: {
    id: 'view-003',
    username: 'operator_monitor',
    email: 'viewer@trustchain5g.org',
    role: 'Viewer',
    department: 'Network Operations Center (NOC)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=viewer_noc'
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('Administrator');

  useEffect(() => {
    // Check localStorage for saved session during Sprint 0 dev mode
    const storedUser = localStorage.getItem('trustchain_user');
    const storedToken = localStorage.getItem('trustchain_token');
    
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        setCurrentRole(parsed.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch {
        // Fallback default admin
        setUser(MOCK_USERS['Administrator']);
        setCurrentRole('Administrator');
      }
    } else {
      // Default auto-login as Administrator for immediate dashboard evaluation
      setUser(MOCK_USERS['Administrator']);
      setCurrentRole('Administrator');
      localStorage.setItem('trustchain_user', JSON.stringify(MOCK_USERS['Administrator']));
      localStorage.setItem('trustchain_token', 'mock-admin-jwt-token-sprint0');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (emailOrUsername: string, _password: string, role?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    let assignedRole: UserRole = role || 'Administrator';
    if (!role && emailOrUsername.toLowerCase().includes('research')) assignedRole = 'Researcher';
    if (!role && emailOrUsername.toLowerCase().includes('view')) assignedRole = 'Viewer';
    
    const selectedUser = MOCK_USERS[assignedRole] || MOCK_USERS['Viewer'];
    const mockToken = `mock-${assignedRole.toLowerCase()}-jwt-token-sprint0`;

    // Try hitting backend if up, otherwise fallback gracefully
    try {
      await axios.post('http://localhost:8000/api/v1/auth/login', {
        username_or_email: emailOrUsername,
        password: 'sprint0-password',
        requested_role_demo: assignedRole
      });
    } catch {
      // Backend disconnected, continue in frontend architectural decoupled mode
    }

    setUser(selectedUser);
    setCurrentRole(assignedRole);
    localStorage.setItem('trustchain_user', JSON.stringify(selectedUser));
    localStorage.setItem('trustchain_token', mockToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('trustchain_user');
    localStorage.removeItem('trustchain_token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    const newUser = MOCK_USERS[newRole];
    setUser(newUser);
    setCurrentRole(newRole);
    localStorage.setItem('trustchain_user', JSON.stringify(newUser));
    localStorage.setItem('trustchain_token', `mock-${newRole.toLowerCase()}-jwt-token-sprint0`);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, currentRole, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
