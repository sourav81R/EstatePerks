import Image from "next/image";
import Link from "next/link";

import { Property } from "@/lib/types";

import styles from "./property-card.module.css";

type PropertyCardProps = {
  property: Property;
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <article className={`${styles.card} card`}>
      <div className={styles.imageWrap}>
        <Image src={property.image} alt={property.name} fill sizes="(max-width: 900px) 100vw, 33vw" />
        <div className={styles.badges}>
          {property.isNewLaunch && <span className="chip">New Launch</span>}
          {property.status === "Ready to Move" && <span className="chip">Ready</span>}
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.name}>{property.name}</p>
        <p className={styles.location}>
          {property.locality}, {property.city}
        </p>
        <p className={styles.price}>{`Rs ${property.priceCr.toFixed(2)} Cr`}</p>
        <p className={styles.meta}>
          {property.bhk ? `${property.bhk} BHK` : property.type} | {property.areaSqft} sqft |{" "}
          {property.type}
        </p>
        <p className={styles.summary}>{property.summary}</p>
        <div className={styles.bottom}>
          <span className={styles.rating}>{property.rating.toFixed(1)} rating</span>
          <Link href={`/properties/${property.slug}`} className={styles.link}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
