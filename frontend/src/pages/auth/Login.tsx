import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useNotification } from '@/contexts';
import { Input, Select, Button, Badge } from '@/components/common';
import { UserRole } from '@/types';
import { Lock, User, KeyRound, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('administrator@trustchain5g.org');
  const [password, setPassword] = useState('secure-sprint0-password');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Administrator');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password, selectedRole);
      addNotification(
        'Authentication Successful',
        `Authenticated as [${selectedRole}] clearance level. Welcome to the TrustChain-5G platform.`,
        'success',
        5000
      );
      navigate('/dashboard');
    } catch {
      addNotification('Authentication Notice', 'Falling back to decoupled Dev Auth session.', 'warning');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { label: 'Administrator (Command & Control)', value: 'Administrator' },
    { label: 'Researcher (FL & AI Analytics Lab)', value: 'Researcher' },
    { label: 'Viewer (Network Operations Center)', value: 'Viewer' },
  ];

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white tracking-wide font-sans flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Enterprise Login
        </h2>
        <Badge variant="primary" size="sm">Sprint 0 Mock Auth</Badge>
      </div>

      <div className="space-y-4">
        <Input
          label="User Electronic Handle or Email"
          type="email"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="admin@trustchain5g.org"
        />

        <Input
          label="Secret Passphrase"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<KeyRound className="w-4 h-4" />}
          placeholder="••••••••••••"
        />

        <Select
          label="Select Demo Clearance Role (Sprint 0)"
          options={roleOptions}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
          helperText="Simulate real-time RBAC restrictions across all cybersecurity dashboards."
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-primary/50" />
          <span>Remember Session Token</span>
        </label>
        <Link to="/auth/forgot-password" className="text-primary hover:underline font-mono">
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-bold uppercase tracking-wider font-mono mt-2"
        isLoading={isSubmitting}
        icon={<ShieldCheck className="w-5 h-5" />}
      >
        Authenticate Session
      </Button>
    </form>
  );
};
