import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@/components/common';
import { useNotification } from '@/contexts';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
      addNotification(
        'Recovery Dispatch Complete',
        `Password reset verification token has been simulated for [${email}].`,
        'success',
        6000
      );
    }, 1000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white tracking-wide font-sans flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" /> Credential Recovery
        </h2>
      </div>

      {!isSent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Enter your primary enterprise account email address. If an active Administrator, Researcher, or Viewer account matches, recovery tokens will be transmitted via secure relay.
          </p>
          <Input
            label="Enterprise Registered Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            placeholder="operator@trustchain5g.org"
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full uppercase font-mono tracking-wider font-bold mt-2"
            isLoading={loading}
            icon={<Send className="w-4 h-4" />}
          >
            Transmit Recovery Token
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-success/20 border border-success/40 flex items-center justify-center text-success mx-auto">
            <Mail className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">Recovery Link Dispatched</h3>
          <p className="text-xs text-slate-400 font-mono">
            Simulated email dispatched to <b className="text-slate-200">{email}</b>. For Sprint 0 verification, you can proceed directly to the reset confirmation page.
          </p>
          <Button
            variant="accent"
            size="md"
            className="w-full font-mono font-bold mt-2"
            onClick={() => navigate('/auth/reset-password')}
          >
            Simulate Reset Token Acceptance
          </Button>
        </div>
      )}

      <div className="border-t border-slate-800/80 pt-3 text-center">
        <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Login Command
        </Link>
      </div>
    </div>
  );
};
