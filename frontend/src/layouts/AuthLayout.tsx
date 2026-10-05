import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, Lock, Cpu, Radio } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden bg-cyber-gradient">
      {/* Decorative cybersecurity glowing elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-xl shadow-primary/20">
              <Shield className="w-7 h-7 animate-pulse" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white font-sans">
              TrustChain-5G
            </span>
          </Link>
          <p className="text-xs text-slate-400 font-mono tracking-wide">
            Intelligent Cybersecurity Platform for Advanced 5G Networks
          </p>
        </div>

        {/* Auth page form container */}
        <div className="glass-panel p-8 shadow-2xl border-slate-800/90 relative overflow-hidden">
          <Outlet />
        </div>

        {/* Security protocol footer badge */}
        <div className="flex items-center justify-center gap-6 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> JWT Protected</span>
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-accent" /> AI Shielded</span>
          <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-success" /> 5G Slicing Ready</span>
        </div>
      </div>
    </div>
  );
};
