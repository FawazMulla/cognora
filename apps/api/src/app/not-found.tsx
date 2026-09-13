import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export default function NotFound() {
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
      <h2>Cognora</h2>
      <p>Page not found</p>
    </div>
  );
}
