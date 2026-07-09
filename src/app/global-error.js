'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>{error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={reset}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600, color: 'white', backgroundColor: '#0A2463', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
