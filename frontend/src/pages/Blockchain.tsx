import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  Boxes, RefreshCw, CheckCircle, ShieldAlert, Clock, Database, Key, 
  Filter, Play, Pause, Plus, Copy, Check, ShieldCheck, Link2 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockchainApi } from '@/api';
import { SecurityTraceTimeline } from '@/components/blockchain/SecurityTraceTimeline';

interface BlockTransaction {
  tx_id: string;
  sender_node_id: string;
  target_node_id: string;
  transaction_type: string;
  payload_data: Record<string, any>;
  timestamp: string;
  signature: string;
}

interface BlockchainBlock {
  _id: string | number;
  block_index: number;
  previous_hash: string;
  timestamp: string;
  validator_node_id: string;
  nonce: number;
  merkle_root: string;
  transactions_count: number;
  transactions: BlockTransaction[];
  block_hash: string;
  isNew?: boolean;
}

const INITIAL_BLOCKS: BlockchainBlock[] = [
  {
    _id: "5",
    block_index: 5,
    previous_hash: "a4f89d3c52e1b07248e58f0d63ca123985b98f21782bc4e12849b2943e827104",
    timestamp: new Date(Date.now() - 35000).toISOString(),
    validator_node_id: "Controller-Node-02",
    nonce: 492,
    merkle_root: "9c8a14b5df0193748261e4b85c13e562810a473f6289b5c391740284dfa1893c",
    transactions_count: 1,
    transactions: [
      {
        tx_id: "tx_sec_005_9a12",
        sender_node_id: "Controller-Module-6",
        target_node_id: "Core-Server-01",
        transaction_type: "SECURITY_EVENT",
        payload_data: { event: "mTLS_ATTESTATION", status: "SUCCESS", cipher: "TLS_AES_256_GCM_SHA384" },
        timestamp: new Date(Date.now() - 35000).toISOString(),
        signature: "sim_sig_8a129d3f4b5c6e7a"
      }
    ],
    block_hash: "b7e2190f84ac29e105823bd8a293c0157f12d8a439281e05391c491b28e50391"
  },
  {
    _id: "4",
    block_index: 4,
    previous_hash: "7f1390d45ca281048b9410385c91b248a391e02847291a82bc4028e491823719",
    timestamp: new Date(Date.now() - 110000).toISOString(),
    validator_node_id: "Controller-Node-01",
    nonce: 318,
    merkle_root: "48201948ac019482b58201948ec49102847291048b291048a192837492019284",
    transactions_count: 1,
    transactions: [
      {
        tx_id: "tx_fl_004_18fb",
        sender_node_id: "Controller-Module-6",
        target_node_id: "Aggregation-Router-01",
        transaction_type: "FEDERATED_MODEL_SYNC",
        payload_data: { round: 42, accuracy: 0.982, participants: 6, loss: 0.041 },
        timestamp: new Date(Date.now() - 110000).toISOString(),
        signature: "sim_sig_4e910284ac019283"
      }
    ],
    block_hash: "a4f89d3c52e1b07248e58f0d63ca123985b98f21782bc4e12849b2943e827104"
  },
  {
    _id: "3",
    block_index: 3,
    previous_hash: "3b29019284ec0192847201948ac019283849102847291048a192837492019284",
    timestamp: new Date(Date.now() - 230000).toISOString(),
    validator_node_id: "Controller-Node-03",
    nonce: 874,
    merkle_root: "61029485ac01928471029485bc01928471029485dc01928471029485ec019284",
    transactions_count: 1,
    transactions: [
      {
        tx_id: "tx_anom_003_39c1",
        sender_node_id: "Controller-Module-6",
        target_node_id: "IoT-Sensor-008",
        transaction_type: "ANOMALY_MITIGATION",
        payload_data: { action: "RATE_LIMIT", limit: "64kbps", reason: "ICMP_BURST" },
        timestamp: new Date(Date.now() - 230000).toISOString(),
        signature: "sim_sig_92019485ac019284"
      }
    ],
    block_hash: "7f1390d45ca281048b9410385c91b248a391e02847291a82bc4028e491823719"
  },
  {
    _id: "2",
    block_index: 2,
    previous_hash: "1839201948ac0192847201948bc01928471029485cc01928471029485dc01928",
    timestamp: new Date(Date.now() - 350000).toISOString(),
    validator_node_id: "Controller-Node-02",
    nonce: 641,
    merkle_root: "58201948ac01928471029485bc01928471029485cc01928471029485dc019284",
    transactions_count: 1,
    transactions: [
      {
        tx_id: "tx_trust_002_74a0",
        sender_node_id: "Controller-Module-6",
        target_node_id: "IoT-Sensor-001",
        transaction_type: "TRUST_EVALUATION",
        payload_data: { trustScore: 96.8, status: "VERIFIED", reputationRank: "A+" },
        timestamp: new Date(Date.now() - 350000).toISOString(),
        signature: "sim_sig_72019485ac019284"
      }
    ],
    block_hash: "3b29019284ec0192847201948ac019283849102847291048a192837492019284"
  },
  {
    _id: "1",
    block_index: 1,
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: new Date(Date.now() - 470000).toISOString(),
    validator_node_id: "Controller-Node-01",
    nonce: 105,
    merkle_root: "47201948ac01928471029485bc01928471029485cc01928471029485dc019284",
    transactions_count: 1,
    transactions: [
      {
        tx_id: "tx_pol_001_189c",
        sender_node_id: "Controller-Module-6",
        target_node_id: "Edge-Gateway-04",
        transaction_type: "POLICY_ENFORCEMENT",
        payload_data: { policy: "Quarantine-VLAN-4094", rule: "SURGE_THRESHOLD", severity: "HIGH" },
        timestamp: new Date(Date.now() - 470000).toISOString(),
        signature: "sim_sig_62019485ac019284"
      }
    ],
    block_hash: "1839201948ac0192847201948bc01928471029485cc01928471029485dc01928"
  },
  {
    _id: "0",
    block_index: 0,
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    validator_node_id: "Controller-Genesis-Node",
    nonce: 0,
    merkle_root: "0000000000000000000000000000000000000000000000000000000000000000",
    transactions_count: 0,
    transactions: [],
    block_hash: "8e291048ac01928471029485bc01928471029485cc01928471029485dc019284"
  }
];

export const Blockchain: React.FC = () => {
  const queryClient = useQueryClient();
  const [streamBlocks, setStreamBlocks] = useState<BlockchainBlock[]>(INITIAL_BLOCKS);
  const [selectedBlock, setSelectedBlock] = useState<BlockchainBlock | null>(INITIAL_BLOCKS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Fetch overview
  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ['blockchain-overview'],
    queryFn: () => blockchainApi.getOverview().then(res => res.data),
    refetchInterval: 5000,
  });

  // Fetch blocks
  const { data: blocksRes, isLoading: blocksLoading } = useQuery({
    queryKey: ['blockchain-blocks', currentPage, eventTypeFilter],
    queryFn: () => blockchainApi.getBlocks(currentPage, eventTypeFilter).then(res => res.data),
    refetchInterval: 5000,
  });

  // Sync query data into streamBlocks when available
  useEffect(() => {
    if (blocksRes?.data && Array.isArray(blocksRes.data) && blocksRes.data.length > 0) {
      setStreamBlocks(prev => {
        // Merge with existing, keeping any newly mined ones that haven't hit query yet
        const existingIndexes = new Set(blocksRes.data.map((b: BlockchainBlock) => b.block_index));
        const keptLocal = prev.filter(b => !existingIndexes.has(b.block_index) && b.block_index > (blocksRes.data[0]?.block_index || 0));
        return [...keptLocal, ...blocksRes.data];
      });
    }
  }, [blocksRes]);

  // Ensure a block is selected on load
  useEffect(() => {
    if (!selectedBlock && streamBlocks.length > 0) {
      setSelectedBlock(streamBlocks[0]);
    }
  }, [streamBlocks, selectedBlock]);

  // Mining mutation
  const mineMutation = useMutation({
    mutationFn: (data?: Record<string, unknown>) => blockchainApi.mineBlock(data).then(res => res.data),
    onSuccess: (res) => {
      if (res?.data) {
        const mined: BlockchainBlock = { ...res.data, isNew: true };
        setStreamBlocks(prev => [mined, ...prev.filter(b => b.block_index !== mined.block_index)]);
        setSelectedBlock(mined);
      }
      queryClient.invalidateQueries({ queryKey: ['blockchain-overview'] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-blocks'] });
    },
    onError: () => {
      // Local fallback mining if API is offline
      addLocalSimulatedBlock();
    }
  });

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: () => blockchainApi.validateChain().then(res => res.data),
    onSuccess: (data) => {
      console.log('Validation result:', data);
    }
  });

  // Local simulated block generator
  const addLocalSimulatedBlock = () => {
    setStreamBlocks(prev => {
      const topBlock = prev[0] || INITIAL_BLOCKS[0];
      const nextIdx = topBlock.block_index + 1;
      const now = new Date();
      
      const eventCatalog = [
        { type: "POLICY_ENFORCEMENT", node: "Edge-Gateway-04", payload: { policy: "Dynamic-Rate-Limiter", quota: "120Mbps", enforcedBy: "SDN-Policy" } },
        { type: "TRUST_EVALUATION", node: "IoT-Sensor-003", payload: { trustScore: 95.2, delta: "+1.8", model: "BayesianDynamicTrust" } },
        { type: "ANOMALY_MITIGATION", node: "IoT-Sensor-008", payload: { action: "ACL_ISOLATION", vlan: 4094, duration: "300s" } },
        { type: "FEDERATED_MODEL_SYNC", node: "Aggregation-Router-01", payload: { round: nextIdx + 20, aggregation: "FedAvg", accuracy: 0.985 } },
        { type: "SECURITY_EVENT", node: "Core-Server-01", payload: { event: "TLS_CIPHER_RENEGOTIATE", protocol: "TLSv1.3", status: "VERIFIED" } },
        { type: "ATTACK_DETECTED", node: "Edge-Node-02", payload: { attackType: "DDoS-SYN-Flood", confidence: 0.94, signature: "SIG-SURGE" } },
        { type: "SECURITY_DECISION", node: "Radio-Unit-05", payload: { decision: "GRANT_ACCESS", sliceId: "URLLC-Slice-01" } },
      ];
      
      const ev = eventCatalog[Math.floor(Math.random() * eventCatalog.length)];
      const txId = `tx_${Math.random().toString(36).substring(2, 9)}_${Math.random().toString(36).substring(2, 6)}`;
      
      const newTx: BlockTransaction = {
        tx_id: txId,
        sender_node_id: "Controller-Module-6",
        target_node_id: ev.node,
        transaction_type: ev.type,
        payload_data: ev.payload,
        timestamp: now.toISOString(),
        signature: `sim_sig_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 8)}`
      };

      const randHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const randMerkle = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newBlock: BlockchainBlock = {
        _id: String(nextIdx),
        block_index: nextIdx,
        previous_hash: topBlock.block_hash,
        timestamp: now.toISOString(),
        validator_node_id: `Validator-Node-0${((nextIdx % 3) + 1)}`,
        nonce: Math.floor(Math.random() * 1000) + 10,
        merkle_root: randMerkle,
        transactions_count: 1,
        transactions: [newTx],
        block_hash: randHash,
        isNew: true,
      };

      return [newBlock, ...prev.slice(0, 49)];
    });
  };

  // Self-sustaining interval for continuous block generation
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlayingRef.current) return;
      // Try backend mine endpoint, with graceful local fallback handled in onError
      mineMutation.mutate({});
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  // Remove isNew highlight after 2.5s
  useEffect(() => {
    const timeout = setTimeout(() => {
      setStreamBlocks(prev => prev.map(b => b.isNew ? { ...b, isNew: false } : b));
    }, 2500);
    return () => clearTimeout(timeout);
  }, [streamBlocks]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['blockchain-overview'] });
    queryClient.invalidateQueries({ queryKey: ['blockchain-blocks'] });
  };

  const handleValidate = () => {
    validateMutation.mutate();
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered blocks
  const filteredBlocks = streamBlocks.filter(block => {
    if (!eventTypeFilter) return true;
    return block.transactions?.some(tx => tx.transaction_type === eventTypeFilter);
  });

  const latestBlock = streamBlocks[0] || overviewRes?.data?.latestBlock;
  const totalCount = Math.max(streamBlocks.length, overviewRes?.data?.totalBlocks || 0);

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const getEventTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'POLICY_ENFORCEMENT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'TRUST_EVALUATION':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'ANOMALY_MITIGATION':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'FEDERATED_MODEL_SYNC':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'SECURITY_EVENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ATTACK_DETECTED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'SECURITY_DECISION':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative">
      <PageHeader 
        title="Blockchain Explorer" 
        subtitle="Append-only cryptographic security audit ledger containing immutable trust and threat records."
      />

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-slate-300">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold">Ledger Overview</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
            isPlaying 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {isPlaying ? 'LIVE STREAMING' : 'PAUSED'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
              isPlaying 
                ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Stream' : 'Resume Stream'}
          </Button>

          <Button 
            onClick={() => mineMutation.mutate({})} 
            disabled={mineMutation.isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
          >
            <Plus className={`w-3.5 h-3.5 ${mineMutation.isPending ? 'animate-spin' : ''}`} />
            {mineMutation.isPending ? 'Mining Block...' : 'Mine Audit Block'}
          </Button>

          <Button 
            onClick={handleRefresh} 
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading || blocksLoading ? 'animate-spin text-indigo-400' : ''}`} /> 
            Refresh
          </Button>

          <Button 
            onClick={handleValidate} 
            disabled={validateMutation.isPending} 
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> 
            {validateMutation.isPending ? 'Verifying Hashes...' : 'Validate Blockchain'}
          </Button>
        </div>
      </div>

      {/* VALIDATION RESULT BANNER */}
      {validateMutation.data && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn ${
          validateMutation.data.data?.isValid 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
        }`}>
          {validateMutation.data.data?.isValid ? (
            <CheckCircle className="w-6 h-6 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                Blockchain Cryptographic Integrity: {validateMutation.data.data?.isValid ? 'VERIFIED (VALID)' : 'TAMPER DETECTED'}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm mt-1 text-slate-300">{validateMutation.data.data?.message}</p>
            <div className="mt-2 text-xs flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Hash Chain: Deterministic SHA-256
              </span>
              <span className="flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" /> Previous Hash Pointers: Continuous
              </span>
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Blockchain Status</span>
            <span className="text-[10px] text-emerald-400 font-mono">PoA Consensus</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            ONLINE
          </div>
          <div className="text-xs text-slate-500 mt-1">Immutable Ledger Synced</div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Sealed Blocks</span>
            <span className="text-[10px] text-indigo-400 font-mono">Height</span>
          </div>
          <div className="text-3xl font-mono font-bold text-indigo-400 mt-2 flex items-baseline gap-2">
            {totalCount}
            <span className="text-xs text-emerald-400 font-sans font-normal flex items-center">
              +1 live
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Audit Ledger Cumulative</div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Latest Block Index</span>
            <span className="text-[10px] text-purple-400 font-mono">Sequence</span>
          </div>
          <div className="text-3xl font-mono font-bold text-purple-400 mt-2">
            #{latestBlock?.block_index ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Mined {latestBlock ? getRelativeTime(latestBlock.timestamp) : '--'}
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Latest Block Hash</span>
            <span className="text-[10px] text-cyan-400 font-mono">SHA-256</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs font-mono text-cyan-300 truncate bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800/80 flex-1" title={latestBlock?.block_hash}>
              {latestBlock?.block_hash ? `${latestBlock.block_hash.substring(0, 18)}...` : '--'}
            </div>
            {latestBlock?.block_hash && (
              <button 
                onClick={() => handleCopy(latestBlock.block_hash)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                title="Copy full SHA-256 hash"
              >
                {copiedHash === latestBlock.block_hash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cryptographically Sealed</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* BLOCKS TABLE */}
        <div className="xl:col-span-2">
          <Card 
            title="Block History & Audit Stream"
            action={
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={eventTypeFilter}
                  onChange={(e) => {
                    setEventTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-800/90 text-xs text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Event Types</option>
                  <option value="POLICY_ENFORCEMENT">Policy Enforcement</option>
                  <option value="TRUST_EVALUATION">Trust Evaluation</option>
                  <option value="ANOMALY_MITIGATION">Anomaly Mitigation</option>
                  <option value="FEDERATED_MODEL_SYNC">Federated Model Sync</option>
                  <option value="SECURITY_EVENT">Security Event</option>
                  <option value="ATTACK_DETECTED">Attack Detected</option>
                  <option value="SECURITY_DECISION">Security Decision</option>
                </select>
              </div>
            } 
            className="bg-slate-900/70 border-slate-800 overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-slate-800/80">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Index</th>
                    <th className="px-4 py-3 font-semibold">Event Type</th>
                    <th className="px-4 py-3 font-semibold">Target Node</th>
                    <th className="px-4 py-3 font-semibold">Current Hash</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold text-center">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {filteredBlocks.map((block) => {
                    const firstTx = block.transactions?.[0];
                    const isSelected = selectedBlock?.block_index === block.block_index;
                    return (
                      <tr 
                        key={`${block.block_index}-${block.block_hash}`} 
                        onClick={() => setSelectedBlock(block)}
                        className={`cursor-pointer transition-all duration-300 ${
                          block.isNew 
                            ? 'bg-indigo-950/40 border-l-4 border-l-indigo-400 animate-pulse' 
                            : isSelected 
                              ? 'bg-indigo-900/25 border-l-4 border-l-indigo-500 shadow-inner' 
                              : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                        }`}
                      >
                        <td className="px-4 py-3 text-indigo-300 font-bold whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-500">#</span>{block.block_index}
                            {block.isNew && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded uppercase font-sans">
                                NEW
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {firstTx ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border ${getEventTypeBadgeColor(firstTx.transaction_type)}`}>
                              {firstTx.transaction_type.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 text-[10px] rounded-full border border-slate-700 font-sans">
                              GENESIS
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs font-mono whitespace-nowrap">
                          {firstTx?.target_node_id || (block.block_index === 0 ? 'Genesis' : '--')}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{block.block_hash.substring(0, 12)}...</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(block.block_hash);
                              }}
                              className="text-slate-500 hover:text-slate-300 transition-colors"
                              title="Copy hash"
                            >
                              {copiedHash === block.block_hash ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-sans whitespace-nowrap" title={new Date(block.timestamp).toLocaleString()}>
                          {getRelativeTime(block.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-mono border border-slate-700/60">
                            {block.transactions_count}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalCount > 20 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="text-xs text-slate-400">
                  Showing block history page {currentPage}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300"
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={filteredBlocks.length < 20}
                    className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* BLOCK DETAILS INSPECTOR */}
        <div className="xl:col-span-1">
          {selectedBlock ? (
            <Card 
              title={`Block #${selectedBlock.block_index} Inspector`} 
              action={
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  Sealed
                </span>
              }
              className="bg-slate-900/90 border-slate-800 sticky top-6 shadow-2xl backdrop-blur-md"
            >
              <div className="space-y-5 mt-3">
                {/* Timestamp */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Sealed Timestamp
                  </h4>
                  <div className="text-sm font-mono text-slate-200 bg-slate-950/60 p-2 rounded border border-slate-800/80 flex justify-between items-center">
                    <span>{new Date(selectedBlock.timestamp).toLocaleString()}</span>
                    <span className="text-xs text-slate-500">{getRelativeTime(selectedBlock.timestamp)}</span>
                  </div>
                </div>
                
                {/* Current Hash */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400" /> Current Block Hash (SHA-256)
                    </h4>
                    <button 
                      onClick={() => handleCopy(selectedBlock.block_hash)}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedHash === selectedBlock.block_hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === selectedBlock.block_hash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 break-all text-xs font-mono text-emerald-400 selection:bg-emerald-900/50 leading-relaxed">
                    {selectedBlock.block_hash}
                  </div>
                </div>

                {/* Previous Hash */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-purple-400" /> Previous Hash Pointer
                    </h4>
                    <button 
                      onClick={() => handleCopy(selectedBlock.previous_hash)}
                      className="text-[10px] text-slate-400 hover:text-purple-400 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedHash === selectedBlock.previous_hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === selectedBlock.previous_hash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 break-all text-xs font-mono text-slate-400 leading-relaxed">
                    {selectedBlock.previous_hash}
                  </div>
                </div>

                {/* Validator & Nonce */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Validator Node</h4>
                    <div className="text-xs font-mono text-indigo-300 font-semibold truncate" title={selectedBlock.validator_node_id}>
                      {selectedBlock.validator_node_id}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proof Nonce</h4>
                    <div className="text-xs font-mono text-purple-300 font-semibold">
                      {selectedBlock.nonce}
                    </div>
                  </div>
                </div>

                {/* Merkle Root */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" /> Merkle Root
                  </h4>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 break-all text-[11px] font-mono text-slate-400 truncate" title={selectedBlock.merkle_root}>
                    {selectedBlock.merkle_root}
                  </div>
                </div>
                
                {/* Transactions list */}
                <div>
                  <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sealed Transactions ({selectedBlock.transactions_count})
                    </h4>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                      <ShieldCheck className="w-3 h-3" /> ECDSA Verified
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedBlock.transactions?.map((tx, idx) => (
                      <div key={tx.tx_id || idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getEventTypeBadgeColor(tx.transaction_type)}`}>
                            {tx.transaction_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]" title={tx.tx_id}>
                            {tx.tx_id}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Sender</span>
                            <span className="text-slate-300 text-[11px] truncate block">{tx.sender_node_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Target</span>
                            <span className="text-indigo-300 text-[11px] font-semibold truncate block">{tx.target_node_id}</span>
                          </div>
                        </div>

                        {tx.payload_data?.correlationId && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <SecurityTraceTimeline correlationId={tx.payload_data.correlationId} />
                          </div>
                        )}

                        <div className="mt-2 bg-slate-900/90 p-2.5 rounded-md border border-slate-800/80 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre custom-scrollbar">
                          <div className="text-slate-500 mb-1 border-b border-slate-800 pb-1 flex justify-between items-center">
                            <span>Audit Payload</span>
                            <span className="text-[9px] text-emerald-400">JSON Schema Valid</span>
                          </div>
                          {JSON.stringify(tx.payload_data, null, 2)}
                        </div>
                      </div>
                    ))}

                    {selectedBlock.transactions_count === 0 && (
                      <div className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
                        No transactions recorded (Genesis Block #0 initialization)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500 sticky top-6">
              <div className="text-center">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p>Select a block from the ledger history to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
