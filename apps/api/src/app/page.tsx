export default function HomePage() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>AI Academic Workspace API</h1>
      <p>
        Status: <strong>Running</strong>
      </p>
      <p>
        Health check: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
