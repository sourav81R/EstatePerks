"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./search-hero.module.css";

type SearchHeroProps = {
  cities: string[];
};

export function SearchHero({ cities }: SearchHeroProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("All");
  const [type, setType] = useState("All");
  const [bhk, setBhk] = useState("0");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (city !== "All") params.set("city", city);
    if (type !== "All") params.set("type", type);
    if (bhk !== "0") params.set("bhk", bhk);

    const query = params.toString();
    router.push(query ? `/properties?${query}` : "/properties");
  };

  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <p className="chip">Live Inventory 2026</p>
          <h1 className={styles.title}>Find The Right Property Faster</h1>
          <p className={styles.subtitle}>
            Search verified new launches, ready homes, and investment hotspots across Indian
            cities.
          </p>

          <form className={styles.searchCard} onSubmit={handleSubmit}>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search by project, locality, or builder"
              className={styles.keyword}
            />
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="All">All Cities</option>
              {cities.map((cityItem) => (
                <option key={cityItem} value={cityItem}>
                  {cityItem}
                </option>
              ))}
            </select>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="All">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
              <option value="Office">Office</option>
            </select>
            <select value={bhk} onChange={(event) => setBhk(event.target.value)}>
              <option value="0">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
            <button type="submit" className="btn btn-primary">
              Search Properties
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
