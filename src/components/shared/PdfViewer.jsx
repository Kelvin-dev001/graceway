'use client';

export default function PdfViewer({ url, title }) {
  if (!url) return null;

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy-500">{title || 'Course Material'}</h4>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-navy-500 hover:bg-navy-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
      </div>
      <p className="text-sm text-gray-500">Click the button above to view or download the course material PDF.</p>
    </div>
  );
}
