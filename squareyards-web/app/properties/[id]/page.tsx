import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompareButton } from "@/components/compare-button";
import { LeadForm } from "@/components/lead-form";
import { PropertyCard } from "@/components/property-card";
import { ScheduleVisitForm } from "@/components/schedule-visit-form";
import { ShortlistButton } from "@/components/shortlist-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPropertyByIdOrSlug, properties } from "@/lib/properties";

import styles from "./property.module.css";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyByIdOrSlug(id);

  if (!property) notFound();

  const related = properties
    .filter((item) => item.city === property.city && item.id !== property.id)
    .slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.page}`}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/properties">Properties</Link> / {property.name}
        </div>

        <section className={styles.grid}>
          <article>
            <div className={styles.heroImage}>
              <Image src={property.image} alt={property.name} fill sizes="(max-width: 1200px) 100vw, 70vw" />
            </div>

            <h1 className={styles.title}>{property.name}</h1>
            <p className={styles.location}>
              {property.locality}, {property.city}, {property.state}
            </p>
            <div className={styles.actions}>
              <ShortlistButton propertyId={property.id} />
              <CompareButton propertyId={property.id} />
            </div>

            <div className={styles.priceBand}>
              <p className={styles.price}>{`Rs ${property.priceCr.toFixed(2)} Cr`}</p>
              <p className={styles.meta}>
                {property.bhk ? `${property.bhk} BHK` : property.type} | {property.areaSqft} sqft
                | {property.pricePerSqft.toLocaleString("en-IN")} Rs/sqft
              </p>
            </div>

            <div className={styles.quickGrid}>
              <div>
                <p className={styles.quickLabel}>Builder</p>
                <p className={styles.quickValue}>{property.builder}</p>
              </div>
              <div>
                <p className={styles.quickLabel}>Status</p>
                <p className={styles.quickValue}>{property.status}</p>
              </div>
              <div>
                <p className={styles.quickLabel}>Possession</p>
                <p className={styles.quickValue}>{property.possession}</p>
              </div>
              <div>
                <p className={styles.quickLabel}>RERA</p>
                <p className={styles.quickValue}>{property.reraId}</p>
              </div>
            </div>

            <section className={`${styles.block} card`}>
              <h2>About Project</h2>
              <p>{property.summary}</p>
              <ul>
                {property.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>

            <section className={`${styles.block} card`}>
              <h2>Amenities</h2>
              <div className={styles.amenities}>
                {property.amenities.map((amenity) => (
                  <span key={amenity}>{amenity}</span>
                ))}
              </div>
            </section>

            <section className={styles.gallery}>
              {property.gallery.map((image, index) => (
                <div key={image} className={styles.galleryCard}>
                  <Image
                    src={image}
                    alt={`${property.name} visual ${index + 1}`}
                    fill
                    sizes="(max-width: 900px) 100vw, 33vw"
                  />
                </div>
              ))}
            </section>
          </article>

          <div className={styles.sidebarStack}>
            <LeadForm propertyId={property.id} propertyName={property.name} />
            <ScheduleVisitForm propertyId={property.id} propertyName={property.name} />
          </div>
        </section>

        <section className={styles.relatedWrap}>
          <div className={styles.relatedHead}>
            <h2 className="section-title">More in {property.city}</h2>
            <Link href={`/properties?city=${encodeURIComponent(property.city)}`}>View all</Link>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
