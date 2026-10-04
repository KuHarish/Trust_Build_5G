import React, { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Boxes, RefreshCw, CheckCircle, ShieldAlert, Clock, Database, Key, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockchainApi } from '@/api';
import { SecurityTraceTimeline } from '@/components/blockchain/SecurityTraceTimeline';

export const Blockchain: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');

  // Fetch overview
  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ['blockchain-overview'],
    queryFn: () => blockchainApi.getOverview().then(res => res.data),
    refetchInterval: 10000,
  });

  // Fetch blocks
  const { data: blocksRes, isLoading: blocksLoading } = useQuery({
    queryKey: ['blockchain-blocks', currentPage, eventTypeFilter],
    queryFn: () => blockchainApi.getBlocks(currentPage, eventTypeFilter).then(res => res.data),
    refetchInterval: 10000,
  });

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: () => blockchainApi.validateChain().then(res => res.data),
    onSuccess: (data) => {
      // Data contains data.data.isValid and data.data.message
      console.log('Validation result:', data);
    }
  });

  const overview = overviewRes?.data;
  const blocks = blocksRes?.data || [];
  const totalBlocks = blocksRes?.total_count || 0;
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['blockchain-overview'] });
    queryClient.invalidateQueries({ queryKey: ['blockchain-blocks'] });
  };

  const handleValidate = () => {
    validateMutation.mutate();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative">
      <PageHeader 
        title="Blockchain Explorer" 
        subtitle="Append-only security audit ledger containing immutable trust and threat records."
      />

      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3 text-slate-300">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold">Ledger Overview</h2>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRefresh} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200">
            <RefreshCw className={`w-4 h-4 ${overviewLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={handleValidate} disabled={validateMutation.isPending} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            <ShieldAlert className="w-4 h-4 mr-1" /> 
            {validateMutation.isPending ? 'Validating...' : 'Validate Blockchain'}
          </Button>
        </div>
      </div>

      {validateMutation.data && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          validateMutation.data.data?.isValid 
            ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-900/20 border-rose-500/50 text-rose-300'
        }`}>
          {validateMutation.data.data?.isValid ? (
            <CheckCircle className="w-6 h-6 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div>
            <h3 className="font-bold text-lg">Blockchain Integrity: {validateMutation.data.data?.isValid ? 'VALID' : 'INVALID / TAMPER DETECTED'}</h3>
            <p className="text-sm mt-1 opacity-90">{validateMutation.data.data?.message}</p>
            <p className="text-xs mt-2 opacity-60">Last checked: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Blockchain Status</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            {overview?.status || 'LOADING...'}
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Blocks</div>
          <div className="text-3xl font-mono text-indigo-400 mt-2">
            {overview?.totalBlocks !== undefined ? overview.totalBlocks : '--'}
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Latest Block Index</div>
          <div className="text-3xl font-mono text-purple-400 mt-2">
            {overview?.latestBlock ? `#${overview.latestBlock.block_index}` : '--'}
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Latest Hash</div>
          <div className="text-sm font-mono text-slate-300 mt-3 truncate" title={overview?.latestBlock?.block_hash}>
            {overview?.latestBlock ? overview.latestBlock.block_hash : '--'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* BLOCKS TABLE */}
        <div className="xl:col-span-2">
          <Card 
            title="Block History"
            action={
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={eventTypeFilter}
                  onChange={(e) => {
                    setEventTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded p-1 outline-none focus:border-indigo-500"
                >
                  <option value="">All Event Types</option>
                  <option value="ATTACK_DETECTED">Attack Detected</option>
                  <option value="SECURITY_DECISION">Security Decision</option>
                  <option value="MITIGATION_REQUESTED">Mitigation Requested</option>
                  <option value="MITIGATION_COMPLETED">Mitigation Completed</option>
                  <option value="TRUST_EVALUATION">Trust Evaluation</option>
                  <option value="SECURITY_ALERT">Security Alert</option>
                </select>
              </div>
            } 
            className="bg-slate-900/70 border-slate-800 overflow-hidden"
          >
            {blocksLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-slate-600" />
                Loading blockchain...
              </div>
            ) : blocks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-lg m-4">
                <Boxes className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <h3 className="text-lg font-medium text-slate-400">No blockchain records available</h3>
                <p className="mt-1">The blockchain currently contains no records to display.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/40 text-slate-400 font-mono text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Index</th>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                      <th className="px-4 py-3 font-medium">Current Hash</th>
                      <th className="px-4 py-3 font-medium">Tx Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    {blocks.map((block: any) => (
                      <tr 
                        key={block.block_index} 
                        onClick={() => setSelectedBlock(block)}
                        className={`cursor-pointer transition-colors ${
                          selectedBlock?.block_index === block.block_index 
                            ? 'bg-indigo-900/30 border-l-2 border-indigo-500' 
                            : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                        }`}
                      >
                        <td className="px-4 py-3 text-indigo-300 font-bold">
                          #{block.block_index}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(block.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                          {block.block_hash.substring(0, 16)}...
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs">
                            {block.transactions_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalBlocks > 20 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="text-xs text-slate-500">
                  Showing page {currentPage}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={blocks.length < 20}
                    className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* BLOCK DETAILS */}
        <div className="xl:col-span-1">
          {selectedBlock ? (
            <Card title={`Block #${selectedBlock.block_index} Details`} className="bg-slate-900/90 border-slate-800 sticky top-6 shadow-2xl">
              <div className="space-y-6 mt-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Timestamp</h4>
                  <div className="text-sm font-mono text-slate-200">
                    {new Date(selectedBlock.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Key className="w-3 h-3" /> Current Hash (SHA-256)</h4>
                  <div className="p-2.5 bg-slate-950 rounded-md border border-slate-800 break-all text-xs font-mono text-emerald-400 selection:bg-emerald-900/50">
                    {selectedBlock.block_hash}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Key className="w-3 h-3" /> Previous Hash</h4>
                  <div className="p-2.5 bg-slate-950 rounded-md border border-slate-800 break-all text-xs font-mono text-slate-400">
                    {selectedBlock.previous_hash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Validator Node</h4>
                    <div className="text-xs font-mono text-slate-300">
                      {selectedBlock.validator_node_id}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nonce</h4>
                    <div className="text-xs font-mono text-slate-300">
                      {selectedBlock.nonce}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">Transactions ({selectedBlock.transactions_count})</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedBlock.transactions?.map((tx: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {tx.transaction_type}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mb-1">
                          <span className="text-slate-500">Target:</span> {tx.target_node_id}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mb-2 truncate" title={tx.tx_id}>
                          <span className="text-slate-500">TxID:</span> {tx.tx_id.substring(0, 16)}...
                        </div>
                        
                        {tx.payload_data?.correlationId && (
                          <div className="mt-4 mb-2">
                            <SecurityTraceTimeline correlationId={tx.payload_data.correlationId} />
                          </div>
                        )}
                        
                        <div className="mt-3 bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
                          <div className="text-slate-500 mb-1 border-b border-slate-800 pb-1">Raw Payload Data</div>
                          {JSON.stringify(tx.payload_data, null, 2)}
                        </div>
                      </div>
                    ))}
                    {selectedBlock.transactions_count === 0 && (
                      <div className="text-xs text-slate-500 italic">No transactions (Genesis Block)</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500 sticky top-6">
              <div className="text-center">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Select a block to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
