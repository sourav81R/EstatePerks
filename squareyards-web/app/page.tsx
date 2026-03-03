import Link from "next/link";

import { AIAssistantBox } from "@/components/ai-assistant-box";
import { NewsletterForm } from "@/components/newsletter-form";
import { PropertyCard } from "@/components/property-card";
import { SearchHero } from "@/components/search-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cityCollections, getCities, getFeaturedProperties, getInventoryStats } from "@/lib/properties";

import styles from "./home.module.css";

export default function HomePage() {
  const featured = getFeaturedProperties();
  const stats = getInventoryStats();
  const cities = getCities();

  return (
    <>
      <SiteHeader />
      <main>
        <SearchHero cities={cities} />

        <section className="container">
          <div className={styles.statsGrid}>
            <article className={`${styles.statCard} card`}>
              <p className={styles.statValue}>{stats.total}+</p>
              <p className={styles.statLabel}>Verified Active Listings</p>
            </article>
            <article className={`${styles.statCard} card`}>
              <p className={styles.statValue}>{stats.newLaunches}</p>
              <p className={styles.statLabel}>New Launches</p>
            </article>
            <article className={`${styles.statCard} card`}>
              <p className={styles.statValue}>{stats.readyToMove}</p>
              <p className={styles.statLabel}>Ready to Move Projects</p>
            </article>
            <article className={`${styles.statCard} card`}>
              <p className={styles.statValue}>Rs {stats.averagePriceCr} Cr</p>
              <p className={styles.statLabel}>Avg Listing Ticket Size</p>
            </article>
          </div>
        </section>

        <section className={`container ${styles.section}`}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className="section-title">Top Curated Projects</h2>
              <p className="section-subtitle">
                High-demand projects shortlisted for city connectivity, builder trust, and resale
                depth.
              </p>
            </div>
            <Link href="/properties" className={styles.link}>
              View all listings
            </Link>
          </div>

          <div className={styles.cardGrid}>
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>

        <section className={`container ${styles.section}`}>
          <h2 className="section-title">Explore City Collections</h2>
          <p className="section-subtitle">Micro-markets with active demand and fresh launches.</p>
          <div className={styles.cityGrid}>
            {cityCollections.map((collection) => (
              <article key={collection.city} className={`${styles.cityCard} card`}>
                <p className={styles.cityName}>{collection.city}</p>
                <p className={styles.cityTitle}>{collection.title}</p>
                <p className={styles.cityMeta}>Avg Price: {collection.avgPrice}</p>
                <p className={styles.cityMeta}>Active projects: {collection.activeProjects}</p>
                <Link href={`/properties?city=${encodeURIComponent(collection.city)}`} className={styles.link}>
                  Browse in {collection.city}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={`container ${styles.section}`}>
          <div className={styles.utilityGrid}>
            <AIAssistantBox />
            <article className={`${styles.newsCard} card`}>
              <p className={styles.newsTitle}>Get Weekly Property Intelligence</p>
              <p className={styles.newsText}>
                Subscribe for city trend updates, new launch alerts, and negotiated deal insights.
              </p>
              <NewsletterForm />
              <div className={styles.points}>
                <span>Builder credibility scorecards</span>
                <span>Launch vs resale comparison briefs</span>
                <span>Finance and EMI trend snapshots</span>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
