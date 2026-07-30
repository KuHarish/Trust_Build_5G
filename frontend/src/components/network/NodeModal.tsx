import React, { ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { SimulationNode, NodeCreateInput, SimulationNodeType } from '@/types/node';
import { AlertCircle } from 'lucide-react';

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NodeCreateInput) => Promise<void>;
  initialData?: SimulationNode | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export const NodeFormModal: React.FC<NodeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  errorMessage = null,
}) => {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<NodeCreateInput>({
    defaultValues: initialData || {
      nodeName: '',
      nodeType: 'Gateway',
      deviceCategory: '5G gNodeB Base Station',
      status: 'ONLINE',
      ipAddress: '10.50.1.10',
      macAddress: '00:1B:44:11:3A:B7',
      latitude: 35.6895,
      longitude: 139.6917,
      signalStrength: -60.0,
      bandwidth: 1000.0,
      latency: 2.0,
      batteryLevel: 100.0,
      firmwareVersion: 'v1.0.0-5g',
      connections: 10,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(
        initialData || {
          nodeName: '',
          nodeType: 'Gateway',
          deviceCategory: '5G gNodeB Base Station',
          status: 'ONLINE',
          ipAddress: '10.50.1.10',
          macAddress: '00:1B:44:11:3A:B7',
          latitude: 35.6895,
          longitude: 139.6917,
          signalStrength: -60.0,
          bandwidth: 1000.0,
          latency: 2.0,
          batteryLevel: 100.0,
          firmwareVersion: 'v1.0.0-5g',
          connections: 10,
        }
      );
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = async (data: NodeCreateInput) => {
    await onSubmit({
      ...data,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      signalStrength: Number(data.signalStrength),
      bandwidth: Number(data.bandwidth),
      latency: Number(data.latency),
      batteryLevel: Number(data.batteryLevel),
      connections: Number(data.connections),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Node [${initialData.nodeName}]` : 'Register New 5G Simulation Node'}
      subtitle={isEdit ? 'Modify active parameters for this simulated network entity.' : 'Provide validated hardware identifiers and geographic positioning.'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Node Designation Name *</label>
            <Input
              {...register('nodeName', { required: 'Node Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
              placeholder="e.g. GNB-Sector-West"
              error={errors.nodeName?.message}
            />
          </div>

          {/* Node Type */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Entity Classification Type *</label>
            <Controller
              name="nodeType"
              control={control}
              render={({ field }: { field: { value: SimulationNodeType; onChange: (val: SimulationNodeType) => void } }) => (
                <Select
                  value={field.value}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value as SimulationNodeType)}
                  options={[
                    { label: 'Smartphone', value: 'Smartphone' },
                    { label: 'IoT Sensor', value: 'IoT Sensor' },
                    { label: 'Edge Device', value: 'Edge Device' },
                    { label: 'Gateway', value: 'Gateway' },
                    { label: 'Autonomous Vehicle', value: 'Autonomous Vehicle' },
                    { label: 'Industrial Device', value: 'Industrial Device' },
                    { label: 'Medical Device', value: 'Medical Device' },
                    { label: 'Drone', value: 'Drone' },
                  ]}
                />
              )}
            />
          </div>

          {/* IP Address */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">IP Address (IPv4 / IPv6) *</label>
            <Input
              {...register('ipAddress', {
                required: 'IP Address is required',
                pattern: { value: IP_REGEX, message: 'Invalid IPv4 or IPv6 format' },
              })}
              placeholder="e.g. 10.50.1.100"
              error={errors.ipAddress?.message}
            />
          </div>

          {/* MAC Address */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Hardware MAC Address *</label>
            <Input
              {...register('macAddress', {
                required: 'MAC Address is required',
                pattern: { value: MAC_REGEX, message: 'Invalid pattern (XX:XX:XX:XX:XX:XX)' },
              })}
              placeholder="e.g. 00:AA:BB:CC:DD:EE"
              error={errors.macAddress?.message}
            />
          </div>

          {/* Latitude */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Latitude (-90 to 90) *</label>
            <Input
              type="number"
              step="any"
              {...register('latitude', {
                required: 'Latitude is required',
                min: { value: -90, message: 'Minimum is -90.0' },
                max: { value: 90, message: 'Maximum is 90.0' },
              })}
              placeholder="35.6895"
              error={errors.latitude?.message}
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Longitude (-180 to 180) *</label>
            <Input
              type="number"
              step="any"
              {...register('longitude', {
                required: 'Longitude is required',
                min: { value: -180, message: 'Minimum is -180.0' },
                max: { value: 180, message: 'Maximum is 180.0' },
              })}
              placeholder="139.6917"
              error={errors.longitude?.message}
            />
          </div>

          {/* Signal Strength & Bandwidth */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Signal Strength (dBm)</label>
            <Input type="number" step="0.1" {...register('signalStrength')} placeholder="-65.0" />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Allocated Bandwidth (Mbps)</label>
            <Input type="number" step="1.0" {...register('bandwidth')} placeholder="1000.0" />
          </div>

          {/* Latency & Battery Level */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Initial Latency (ms)</label>
            <Input type="number" step="0.1" {...register('latency')} placeholder="5.0" />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Battery Charge Level (%)</label>
            <Input type="number" step="0.5" {...register('batteryLevel')} placeholder="100.0" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing Telemetry...' : isEdit ? 'Save Node Modifications' : 'Register 5G Node'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  nodeName?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nodeName = '',
  isDeleting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Node Removal"
      subtitle="Are you sure you want to delete this simulated entity?"
      size="sm"
    >
      <div className="text-left space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          You are about to permanently decommission <span className="font-bold text-white font-mono">{nodeName}</span> from the active 5G simulation registry. This action will terminate its telemetry streams.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Keep Active
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Decommissioning...' : 'Confirm Deletion'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
