import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, Package, Truck, Shirt, CheckSquare } from 'lucide-react';

const StatusIcon = ({ status, size = 24, className = '' }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          label: 'Pending'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          label: 'Approved'
        };
      case 'washing':
        return {
          icon: Package,
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-100',
          label: 'Washing'
        };
      case 'drying':
        return {
          icon: Shirt,
          color: 'text-purple-500',
          bgColor: 'bg-purple-100',
          label: 'Drying'
        };
      case 'folding':
        return {
          icon: Package,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          label: 'Folding'
        };
      case 'ready':
        return {
          icon: CheckSquare,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          label: 'Ready for Pickup'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Completed'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          label: 'Rejected'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Cancelled'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${className}`}>
      <IconComponent size={size} className={config.color} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

// Individual status components for specific use cases
export const PendingIcon = (props) => <StatusIcon status="pending" {...props} />;
export const ApprovedIcon = (props) => <StatusIcon status="approved" {...props} />;
export const WashingIcon = (props) => <StatusIcon status="washing" {...props} />;
export const DryingIcon = (props) => <StatusIcon status="drying" {...props} />;
export const FoldingIcon = (props) => <StatusIcon status="folding" {...props} />;
export const ReadyIcon = (props) => <StatusIcon status="ready" {...props} />;
export const CompletedIcon = (props) => <StatusIcon status="completed" {...props} />;
export const RejectedIcon = (props) => <StatusIcon status="rejected" {...props} />;
export const CancelledIcon = (props) => <StatusIcon status="cancelled" {...props} />;

export default StatusIcon;
