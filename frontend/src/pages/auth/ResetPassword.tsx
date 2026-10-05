import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button } from '@/components/common';
import { useNotification } from '@/contexts';
import { KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [token, setToken] = useState('RESET-TOKEN-MOCK-8409');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addNotification(
        'Password Successfully Recreated',
        'Your cryptographic authentication passphrase has been updated in the mock foundation.',
        'success',
        6000
      );
      navigate('/auth/login');
    }, 1000);
  };

  return (
    <form onSubmit={handleReset} className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white tracking-wide font-sans flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent" /> Reset Credentials
        </h2>
      </div>

      <div className="space-y-4">
        <Input
          label="One-Time Verification Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          helperText="Supplied in simulated recovery email notification."
        />

        <Input
          label="New Cryptographic Passphrase"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••••••"
        />

        <Input
          label="Confirm New Passphrase"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          error={error}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-bold uppercase font-mono tracking-wider mt-2"
        isLoading={loading}
        icon={<ShieldCheck className="w-5 h-5" />}
      >
        Update Credentials & Authenticate
      </Button>

      <div className="border-t border-slate-800/80 pt-3 text-center">
        <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Cancel and return to Login
        </Link>
      </div>
    </form>
  );
};
