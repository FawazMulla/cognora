'use client';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h2>Cognora</h2>
      <p>An unexpected error occurred.</p>
      <button
        onClick={() => reset()}
        style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
