'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900">
      <h1 className="text-2xl font-bold text-white">Something went wrong!</h1>
      <p className="text-gray-300">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
