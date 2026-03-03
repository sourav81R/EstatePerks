import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedProperties, getPropertyByIdOrSlug } from "@/lib/properties";

import styles from "./compare.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseIds(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ids = parseIds(params.ids);

  const selected = ids
    .map((id) => getPropertyByIdOrSlug(id))
    .filter((property): property is NonNullable<typeof property> => Boolean(property));

  const compared = selected.length ? selected : getFeaturedProperties(2);

  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.page}`}>
        <section>
          <h1 className="section-title">Compare Properties</h1>
          <p className="section-subtitle">
            Side-by-side view for price, area, builder track-record, possession timeline, and
            market score.
          </p>
          {!ids.length && (
            <div className={`${styles.info} card`}>
              <p>
                No property selected from compare tray yet. Showing featured projects as reference.
                Add properties from listings to compare your own shortlist.
              </p>
              <Link href="/properties">Go to listings</Link>
            </div>
          )}
        </section>

        <section className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Parameter</th>
                {compared.map((property) => (
                  <th key={property.id}>
                    <p>{property.name}</p>
                    <span>
                      {property.locality}, {property.city}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Price</td>
                {compared.map((property) => (
                  <td key={`${property.id}-price`}>Rs {property.priceCr.toFixed(2)} Cr</td>
                ))}
              </tr>
              <tr>
                <td>Type</td>
                {compared.map((property) => (
                  <td key={`${property.id}-type`}>{property.type}</td>
                ))}
              </tr>
              <tr>
                <td>BHK</td>
                {compared.map((property) => (
                  <td key={`${property.id}-bhk`}>{property.bhk ? `${property.bhk} BHK` : "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td>Super Area</td>
                {compared.map((property) => (
                  <td key={`${property.id}-area`}>{property.areaSqft} sqft</td>
                ))}
              </tr>
              <tr>
                <td>Price / sqft</td>
                {compared.map((property) => (
                  <td key={`${property.id}-psf`}>{property.pricePerSqft.toLocaleString("en-IN")} Rs</td>
                ))}
              </tr>
              <tr>
                <td>Builder</td>
                {compared.map((property) => (
                  <td key={`${property.id}-builder`}>{property.builder}</td>
                ))}
              </tr>
              <tr>
                <td>Status</td>
                {compared.map((property) => (
                  <td key={`${property.id}-status`}>{property.status}</td>
                ))}
              </tr>
              <tr>
                <td>Possession</td>
                {compared.map((property) => (
                  <td key={`${property.id}-possession`}>{property.possession}</td>
                ))}
              </tr>
              <tr>
                <td>User Rating</td>
                {compared.map((property) => (
                  <td key={`${property.id}-rating`}>{property.rating.toFixed(1)} / 5</td>
                ))}
              </tr>
              <tr>
                <td>Highlights</td>
                {compared.map((property) => (
                  <td key={`${property.id}-highlights`}>
                    <ul>
                      {property.highlights.slice(0, 3).map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Action</td>
                {compared.map((property) => (
                  <td key={`${property.id}-action`}>
                    <Link href={`/properties/${property.slug}`}>View project</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
