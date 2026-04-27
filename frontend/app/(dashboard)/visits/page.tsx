'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  cancelled: XCircle,
  scheduled: Clock,
  confirmed: Clock,
  no_show: XCircle,
};

export default function VisitsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>();
  const { data, isLoading } = useActivities({
    page,
    size: 10,
    status: statusFilter,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading visits..." />;
  }

  const activities = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setStatusFilter(undefined);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              !statusFilter ? 'bg-primary text-primary-foreground' : 'border border-input'
            }`}
          >
            All
          </button>
          {['scheduled', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          <Plus className="h-5 w-5" />
          Create Visit
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = statusIcons[activity.status] || Clock;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
            >
              <Icon className="mt-1 h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{activity.customerName}</p>
                <p className="text-sm text-muted-foreground">{activity.whatsappNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(activity.scheduledAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    statusColors[activity.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {activity.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No visits found</p>
        </div>
      )}
    </div>
  );
}
