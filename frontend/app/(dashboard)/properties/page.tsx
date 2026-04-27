'use client';

import { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProperties(page, 12);

  if (isLoading) {
    return <LoadingSpinner message="Loading properties..." />;
  }

  const properties = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((prop) => (
          <div
            key={prop.id}
            className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{prop.bhk} BHK</p>
                <p className="text-sm text-muted-foreground">{prop.area} sqft</p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                {prop.status}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(prop.price)}</p>
            <button className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
              View Details
            </button>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No properties found</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-2">
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
  );
}
