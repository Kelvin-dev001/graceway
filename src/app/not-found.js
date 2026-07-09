import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <h2 className="text-xl font-bold text-navy-500 mb-2">Page not found</h2>
      <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist or may have moved.</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-navy-500 hover:bg-navy-600 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
