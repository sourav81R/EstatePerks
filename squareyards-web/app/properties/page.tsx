import { PropertyCard } from "@/components/property-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { filterProperties, getCities } from "@/lib/properties";
import { PropertyType } from "@/lib/types";

import styles from "./properties.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const city = readQuery(params.city) || "All";
  const type = (readQuery(params.type) || "All") as PropertyType | "All";
  const q = readQuery(params.q);
  const bhk = Number(readQuery(params.bhk)) || 0;
  const minPriceCr = Number(readQuery(params.minPriceCr)) || undefined;
  const maxPriceCr = Number(readQuery(params.maxPriceCr)) || undefined;
  const sortByRaw = readQuery(params.sortBy);
  const sortBy =
    sortByRaw === "price_asc" ||
    sortByRaw === "price_desc" ||
    sortByRaw === "rating_desc" ||
    sortByRaw === "new_launch"
      ? sortByRaw
      : "relevance";

  const results = filterProperties({
    city,
    type,
    keyword: q,
    bhk: bhk > 0 ? bhk : undefined,
    minPriceCr,
    maxPriceCr,
    sortBy,
  });

  const cities = getCities();

  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.page}`}>
        <section className={styles.top}>
          <h1 className="section-title">Property Listings</h1>
          <p className="section-subtitle">
            Search projects by city, type, and budget. Data is powered by Next.js APIs.
          </p>
        </section>

        <section className={styles.grid}>
          <aside className={`${styles.filterPane} card`}>
            <p className={styles.filterTitle}>Refine Search</p>
            <form className={styles.filterForm} method="GET" action="/properties">
              <label>
                Keyword
                <input name="q" defaultValue={q} placeholder="Builder, locality, project" />
              </label>

              <label>
                City
                <select name="city" defaultValue={city}>
                  <option value="All">All Cities</option>
                  {cities.map((cityItem) => (
                    <option key={cityItem} value={cityItem}>
                      {cityItem}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Property Type
                <select name="type" defaultValue={type}>
                  <option value="All">All Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Plot">Plot</option>
                  <option value="Office">Office</option>
                </select>
              </label>

              <label>
                BHK
                <select name="bhk" defaultValue={bhk > 0 ? String(bhk) : "0"}>
                  <option value="0">Any</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                </select>
              </label>

              <label>
                Sort by
                <select name="sortBy" defaultValue={sortBy}>
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Top Rated</option>
                  <option value="new_launch">New Launch First</option>
                </select>
              </label>

              <label>
                Min Price (Cr)
                <input name="minPriceCr" type="number" step="0.1" defaultValue={minPriceCr} />
              </label>

              <label>
                Max Price (Cr)
                <input name="maxPriceCr" type="number" step="0.1" defaultValue={maxPriceCr} />
              </label>

              <button className="btn btn-primary" type="submit">
                Apply Filters
              </button>
            </form>
          </aside>

          <section>
            <p className={styles.resultMeta}>{results.length} projects found</p>
            <div className={styles.cards}>
              {results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            {!results.length && (
              <div className={`${styles.empty} card`}>
                <p>No properties matched these filters.</p>
              </div>
            )}
          </section>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
