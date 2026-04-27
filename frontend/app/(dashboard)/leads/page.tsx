'use client';

import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useLeads(page, 10, search);

  if (isLoading) {
    return <LoadingSpinner message="Loading leads..." />;
  }

  const leads = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background px-4 py-2"
          />
        </div>
        <button className="ml-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          <Plus className="h-5 w-5" />
          Add Lead
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border hover:bg-muted">
                <td className="px-6 py-4">{lead.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{lead.phone}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {lead.status || 'New'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {lead.createdAt ? formatDate(lead.createdAt) : '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-primary hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No leads found</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {leads.length} of {data?.totalElements || 0} leads
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-input px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!data?.hasNext}
            className="rounded-lg border border-input px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
