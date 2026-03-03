import Link from "next/link";

import { AIAssistantBox } from "@/components/ai-assistant-box";
import { NewsletterForm } from "@/components/newsletter-form";
import { PropertyCard } from "@/components/property-card";
import { SearchHero } from "@/components/search-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  advisoryGuides,
  cityCollections,
  getCities,
  getFeaturedProperties,
  getInventoryStats,
  marketTrends,
  requirementCollections,
  topBuilders,
} from "@/lib/properties";

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
          <h2 className="section-title">Browse By Requirement</h2>
          <p className="section-subtitle">
            Journey-based discovery: first home, investment, or ready-to-move.
          </p>
          <div className={styles.requirementGrid}>
            {requirementCollections.map((item) => (
              <article key={item.id} className={`${styles.requirementCard} card`}>
                <p className={styles.requirementTitle}>{item.title}</p>
                <p className={styles.requirementSub}>{item.subtitle}</p>
                <p className={styles.requirementMetric}>{item.metric}</p>
                <Link href={item.href}>Explore</Link>
              </article>
            ))}
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
          <h2 className="section-title">Top Builders</h2>
          <p className="section-subtitle">Developer discovery with portfolio and city footprint.</p>
          <div className={styles.builderGrid}>
            {topBuilders.map((builder) => (
              <article key={builder.name} className={`${styles.builderCard} card`}>
                <p className={styles.builderName}>{builder.name}</p>
                <p className={styles.builderMeta}>{builder.activeProjects} active projects</p>
                <p className={styles.builderMeta}>{builder.deliveredHomes} homes delivered</p>
                <p className={styles.builderCities}>{builder.cities.join(" | ")}</p>
              </article>
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
          <h2 className="section-title">Market Trend Snapshot</h2>
          <p className="section-subtitle">Indicative demand and price momentum by city cluster.</p>
          <div className={styles.trendGrid}>
            {marketTrends.map((trend) => (
              <article key={trend.city} className={`${styles.trendCard} card`}>
                <div className={styles.trendHead}>
                  <p>{trend.city}</p>
                  <span>{trend.oneYearGrowthPct}% YoY</span>
                </div>
                <p className={styles.trendPrice}>
                  Avg {trend.avgPricePerSqft.toLocaleString("en-IN")} Rs/sqft
                </p>
                <div className={styles.trendMeter}>
                  <span style={{ width: `${trend.demandScore}%` }} />
                </div>
                <p className={styles.trendScore}>Demand score: {trend.demandScore}/100</p>
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

        <section className={`container ${styles.section}`}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className="section-title">Tools & Guides</h2>
              <p className="section-subtitle">
                Transaction calculators and buyer guides used by property advisors.
              </p>
            </div>
            <Link href="/tools/emi-calculator" className={styles.link}>
              Open EMI Calculator
            </Link>
          </div>
          <div className={styles.guideGrid}>
            {advisoryGuides.map((guide) => (
              <article key={guide.title} className={`${styles.guideCard} card`}>
                <p className={styles.guideTitle}>{guide.title}</p>
                <p className={styles.guideSummary}>{guide.summary}</p>
                <Link href={guide.href}>Read guide</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
