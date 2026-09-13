'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <h2>Cognora</h2>
          <p>A critical application error occurred.</p>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
