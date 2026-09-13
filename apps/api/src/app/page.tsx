import fs from "node:fs";
import path from "node:path";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  // If Vite's compiled index.html exists in public, serve it as raw HTML
  const indexPath = path.join(process.cwd(), "public", "index.html");
  if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, "utf-8");
    return (
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ display: "contents" }}
      />
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
      <h2>Cognora Unified Monolith</h2>
      <p>Building frontend assets...</p>
    </div>
  );
}
