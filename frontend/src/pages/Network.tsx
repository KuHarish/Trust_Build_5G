import React from 'react';
import { PlaceholderPageTemplate } from '@/components/common/PlaceholderPageTemplate';
import { Radio } from 'lucide-react';

export const Network: React.FC = () => {
  return (
    <PlaceholderPageTemplate
      title="5G Network Simulation & Topology"
      subtitle="Surveillance and simulated operations across gNodeB base stations, User Plane Functions (UPF), and Core Gateway relays."
      moduleName="Network Simulation"
      icon={Radio}
      accentColor="primary"
      features={[
        '3GPP Release 17 compliant virtual radio topology synthesis',
        'Real-time link throughput and latency injection (NS-3 bridge)',
        'Dynamic network slice resource allocation and bandwidth capping',
        'Simulated User Equipment (UE) attach and handover protocols'
      ]}
      architectureNote="Pydantic Node models & MongoDB indexing ready in backend/app/models/node.py."
    />
  );
};
