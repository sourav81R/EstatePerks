import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ padding: "4rem 0" }}>
        <h1 className="section-title">Property Not Found</h1>
        <p className="section-subtitle" style={{ marginTop: "0.6rem" }}>
          The listing may have moved or is no longer available.
        </p>
        <Link href="/properties" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex", padding: "0.75rem 1rem" }}>
          Back to Listings
        </Link>
      </main>
    </>
  );
}
