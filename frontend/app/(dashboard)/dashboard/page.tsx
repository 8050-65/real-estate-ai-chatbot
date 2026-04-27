'use client';

import { Users, Calendar, Zap, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useLeads } from '@/hooks/useLeads';
import { useActivities } from '@/hooks/useActivities';

export default function DashboardPage() {
  const { data: leadsData, isLoading: leadsLoading } = useLeads(1, 1);
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({
    page: 1,
    size: 1,
  });

  if (leadsLoading || activitiesLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const totalLeads = leadsData?.totalElements || 0;
  const totalActivities = activitiesData?.totalElements || 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={totalLeads}
          change={12}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Activities Today"
          value={totalActivities}
          change={8}
          icon={<Calendar className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Hot Leads"
          value="24"
          change={-2}
          icon={<Zap className="h-6 w-6" />}
          color="orange"
        />
        <KPICard
          title="Conversion Rate"
          value="32%"
          change={5}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Lead Sources (30 days)</h3>
          <div className="mt-4 text-center text-muted-foreground">
            Chart rendering coming soon
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Activity Status</h3>
          <div className="mt-4 text-center text-muted-foreground">
            Chart rendering coming soon
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <div className="mt-4 text-center text-muted-foreground">
          Recent conversations will appear here
        </div>
      </div>
    </div>
  );
}
