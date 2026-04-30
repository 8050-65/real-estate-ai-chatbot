import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="text-gray-300">Page not found</p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
