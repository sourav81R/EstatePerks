import { Property, PropertyFilters } from "./types";

export const properties: Property[] = [
  {
    id: "p1",
    slug: "lodha-bella-vita-thane",
    name: "Lodha Bella Vita",
    city: "Mumbai",
    locality: "Majiwada",
    state: "Maharashtra",
    type: "Apartment",
    bhk: 3,
    bathrooms: 3,
    areaSqft: 1680,
    priceCr: 3.15,
    pricePerSqft: 18750,
    status: "Under Construction",
    possession: "Dec 2027",
    builder: "Lodha Group",
    reraId: "P51700041111",
    rating: 4.7,
    isFeatured: true,
    isNewLaunch: true,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Premium high-rise homes with skyline views, metro access, and a full lifestyle clubhouse.",
    highlights: ["5-acre podium", "Near Eastern Express Highway", "35+ amenities"],
    amenities: ["Clubhouse", "Infinity Pool", "Yoga Deck", "Sky Lounge", "Kids Zone"],
  },
  {
    id: "p2",
    slug: "godrej-eden-estate-gurgaon",
    name: "Godrej Eden Estate",
    city: "Gurgaon",
    locality: "Sector 39",
    state: "Haryana",
    type: "Plot",
    bhk: 0,
    bathrooms: 0,
    areaSqft: 2200,
    priceCr: 2.05,
    pricePerSqft: 9318,
    status: "New Launch",
    possession: "Jun 2028",
    builder: "Godrej Properties",
    reraId: "HRERA-S39-2026-009",
    rating: 4.5,
    isFeatured: true,
    isNewLaunch: true,
    image:
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Gated plotted development with central greens and fast connectivity to business districts.",
    highlights: ["Dual clubhouse access", "Golf-course belt", "Low-density layout"],
    amenities: ["Jogging Track", "Landscape Park", "Security Gate", "Retail Court"],
  },
  {
    id: "p3",
    slug: "prestige-waterford-whitefield",
    name: "Prestige Waterford",
    city: "Bangalore",
    locality: "Whitefield",
    state: "Karnataka",
    type: "Apartment",
    bhk: 4,
    bathrooms: 4,
    areaSqft: 2555,
    priceCr: 4.25,
    pricePerSqft: 16634,
    status: "Ready to Move",
    possession: "Immediate",
    builder: "Prestige Group",
    reraId: "PRM/KA/RERA/1258/446/PR/220123",
    rating: 4.8,
    isFeatured: true,
    image:
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154205-4cc7f4f0a7c9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Luxury residences on ECC Road with strong rental demand from IT corridor professionals.",
    highlights: ["2 clubhouses", "Near ITPL", "Lake-view tower selection"],
    amenities: ["Business Lounge", "Gym", "Lap Pool", "Co-working", "Multipurpose Hall"],
  },
  {
    id: "p4",
    slug: "m3m-capital-sector-113",
    name: "M3M Capital",
    city: "Gurgaon",
    locality: "Sector 113",
    state: "Haryana",
    type: "Apartment",
    bhk: 3,
    bathrooms: 3,
    areaSqft: 1800,
    priceCr: 2.72,
    pricePerSqft: 15111,
    status: "Under Construction",
    possession: "Mar 2028",
    builder: "M3M India",
    reraId: "RC/REP/HARERA/GGM/689/421/2026/11",
    rating: 4.4,
    isNewLaunch: true,
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Dwarka Expressway address with upgraded layouts and a focus on premium family living.",
    highlights: ["90% open greens", "Dedicated kids district", "Direct expressway access"],
    amenities: ["Spa", "Mini Theatre", "Squash Court", "Pet Park", "EV Charging"],
  },
  {
    id: "p5",
    slug: "sobha-neopolis-panathur",
    name: "Sobha Neopolis",
    city: "Bangalore",
    locality: "Panathur Road",
    state: "Karnataka",
    type: "Apartment",
    bhk: 3,
    bathrooms: 3,
    areaSqft: 1804,
    priceCr: 2.85,
    pricePerSqft: 15798,
    status: "New Launch",
    possession: "Sep 2029",
    builder: "Sobha Limited",
    reraId: "PRM/KA/RERA/1251/446/PR/260226/007889",
    rating: 4.6,
    isNewLaunch: true,
    image:
      "https://images.unsplash.com/photo-1600566752227-8f3b4f4fdb58?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617098474202-0d0d7f60f8c2?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Mediterranean-inspired township with premium finishes and quick access to Outer Ring Road.",
    highlights: ["Low-density towers", "3-side open units", "Builder warranty support"],
    amenities: ["Olympic Pool", "Art Studio", "Tennis Court", "Sky Deck"],
  },
  {
    id: "p6",
    slug: "ats-homekraft-sanctuary-noida",
    name: "ATS Homekraft Sanctuary",
    city: "Noida",
    locality: "Sector 105",
    state: "Uttar Pradesh",
    type: "Apartment",
    bhk: 4,
    bathrooms: 4,
    areaSqft: 2900,
    priceCr: 4.95,
    pricePerSqft: 17069,
    status: "Under Construction",
    possession: "Jan 2029",
    builder: "ATS Group",
    reraId: "UPRERAPRJ009965",
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1615529162924-f860538846d6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Large format residences with landscaped decks and quick expressway access for NCR commute.",
    highlights: ["Ultra-low density", "Two-sided open homes", "Club + concierge"],
    amenities: ["Grand Lobby", "Gymnasium", "Indoor Sports", "Library", "Music Room"],
  },
  {
    id: "p7",
    slug: "shapoorji-joyville-hinjewadi",
    name: "Shapoorji Joyville",
    city: "Pune",
    locality: "Hinjewadi Phase 1",
    state: "Maharashtra",
    type: "Apartment",
    bhk: 2,
    bathrooms: 2,
    areaSqft: 940,
    priceCr: 0.89,
    pricePerSqft: 9468,
    status: "Ready to Move",
    possession: "Immediate",
    builder: "Shapoorji Pallonji",
    reraId: "P52100032031",
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Value-led apartment community close to IT employment hubs and education zones.",
    highlights: ["Strong rental pipeline", "Township retail", "Metro corridor proximity"],
    amenities: ["Cricket Pitch", "Pool", "Amphitheatre", "Meditation Court"],
  },
  {
    id: "p8",
    slug: "dlf-crest-gurgaon",
    name: "DLF Crest",
    city: "Gurgaon",
    locality: "Sector 54",
    state: "Haryana",
    type: "Apartment",
    bhk: 4,
    bathrooms: 5,
    areaSqft: 3518,
    priceCr: 8.9,
    pricePerSqft: 25298,
    status: "Ready to Move",
    possession: "Immediate",
    builder: "DLF",
    reraId: "HRERA-REV-54-008",
    rating: 4.9,
    isFeatured: true,
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Iconic Golf Course Road address with ultra-luxury specifications and established resale demand.",
    highlights: ["Prime micro-market", "High-end neighborhood", "Large deck homes"],
    amenities: ["Private Lift Lobby", "Concierge", "Indoor Pool", "Business Club"],
  },
  {
    id: "p9",
    slug: "brigade-caladium-hebbal",
    name: "Brigade Caladium",
    city: "Bangalore",
    locality: "Hebbal",
    state: "Karnataka",
    type: "Apartment",
    bhk: 3,
    bathrooms: 3,
    areaSqft: 2000,
    priceCr: 3.35,
    pricePerSqft: 16750,
    status: "Ready to Move",
    possession: "Immediate",
    builder: "Brigade Enterprises",
    reraId: "PRM/KA/RERA/1251/472/PR/200226/007733",
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1617098474202-0d0d7f60f8c2?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560185127-2be3d6a7e4ba?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Well-connected homes near airport corridor with robust social infrastructure.",
    highlights: ["Airport access", "Large open courtyard", "Premium tower design"],
    amenities: ["Steam Room", "Jogging Track", "Banquet Hall", "Kids Pool"],
  },
  {
    id: "p10",
    slug: "maison-skyview-hyderabad",
    name: "Maison Skyview",
    city: "Hyderabad",
    locality: "Kokapet",
    state: "Telangana",
    type: "Apartment",
    bhk: 3,
    bathrooms: 3,
    areaSqft: 2105,
    priceCr: 2.46,
    pricePerSqft: 11686,
    status: "Under Construction",
    possession: "Nov 2027",
    builder: "Maison Realty",
    reraId: "P02400005433",
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "High-rise project in western Hyderabad with strong potential from upcoming infra upgrades.",
    highlights: ["Financial District proximity", "Corner units", "Smart home features"],
    amenities: ["Rooftop Lounge", "Indoor Games", "Gym", "Open Air Theatre"],
  },
  {
    id: "p11",
    slug: "casagrand-marina-chennai",
    name: "Casagrand Marina",
    city: "Chennai",
    locality: "OMR",
    state: "Tamil Nadu",
    type: "Apartment",
    bhk: 2,
    bathrooms: 2,
    areaSqft: 1148,
    priceCr: 0.98,
    pricePerSqft: 8536,
    status: "New Launch",
    possession: "Aug 2028",
    builder: "Casagrand",
    reraId: "TN/35/BUILDING/0213/2026",
    rating: 4.2,
    isNewLaunch: true,
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Lifestyle community in OMR with work-from-home friendly layouts and social clubs.",
    highlights: ["Near tech parks", "Efficient floor plans", "Price-value leader"],
    amenities: ["Reading Lounge", "Gym", "Pool", "Shuttle Service"],
  },
  {
    id: "p12",
    slug: "tata-eden-court-kolkata",
    name: "Tata Eden Court",
    city: "Kolkata",
    locality: "New Town",
    state: "West Bengal",
    type: "Apartment",
    bhk: 3,
    bathrooms: 3,
    areaSqft: 1640,
    priceCr: 1.58,
    pricePerSqft: 9634,
    status: "Ready to Move",
    possession: "Immediate",
    builder: "Tata Housing",
    reraId: "WBRERA/P/NOR/2026/000399",
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    ],
    summary:
      "Trusted township living in New Town with schools, parks, and shopping nearby.",
    highlights: ["Integrated township", "High livability score", "Strong community"],
    amenities: ["Community Hall", "Gym", "Landscape Garden", "Outdoor Sports"],
  },
];

export const cityCollections = [
  {
    city: "Gurgaon",
    title: "Dwarka Expressway Growth Belt",
    avgPrice: "Rs 12,900/sqft",
    activeProjects: 94,
  },
  {
    city: "Bangalore",
    title: "East Bangalore Tech Cluster",
    avgPrice: "Rs 11,400/sqft",
    activeProjects: 137,
  },
  {
    city: "Mumbai",
    title: "Thane Premium Corridor",
    avgPrice: "Rs 19,300/sqft",
    activeProjects: 76,
  },
  {
    city: "Noida",
    title: "Noida-Greater Noida Central",
    avgPrice: "Rs 9,600/sqft",
    activeProjects: 58,
  },
];

export const requirementCollections = [
  {
    id: "new-launch",
    title: "New Launch Projects",
    subtitle: "Early-bird pricing and launch inventory",
    href: "/properties?type=Apartment",
    metric: "Starting from Rs 0.98 Cr",
  },
  {
    id: "ready-move",
    title: "Ready To Move Homes",
    subtitle: "Immediate possession options",
    href: "/properties?city=Bangalore",
    metric: "Zero waiting period",
  },
  {
    id: "investment",
    title: "Investor Picks",
    subtitle: "High rental-demand micro markets",
    href: "/properties?city=Gurgaon",
    metric: "4.8% avg rental yield",
  },
  {
    id: "luxury",
    title: "Luxury Collection",
    subtitle: "Premium addresses and larger layouts",
    href: "/properties?minPriceCr=4",
    metric: "Projects above Rs 4 Cr",
  },
];

export const topBuilders = [
  {
    name: "DLF",
    activeProjects: 22,
    deliveredHomes: "1,80,000+",
    cities: ["Gurgaon", "Chandigarh", "Delhi"],
  },
  {
    name: "Godrej Properties",
    activeProjects: 37,
    deliveredHomes: "1,20,000+",
    cities: ["Mumbai", "Pune", "Gurgaon", "Bangalore"],
  },
  {
    name: "Prestige Group",
    activeProjects: 29,
    deliveredHomes: "1,65,000+",
    cities: ["Bangalore", "Hyderabad", "Chennai", "Mumbai"],
  },
  {
    name: "Sobha",
    activeProjects: 18,
    deliveredHomes: "85,000+",
    cities: ["Bangalore", "Gurgaon", "Pune", "Kochi"],
  },
];

export const marketTrends = [
  {
    city: "Gurgaon",
    avgPricePerSqft: 12900,
    oneYearGrowthPct: 14.8,
    demandScore: 92,
  },
  {
    city: "Bangalore",
    avgPricePerSqft: 11400,
    oneYearGrowthPct: 12.1,
    demandScore: 89,
  },
  {
    city: "Mumbai",
    avgPricePerSqft: 19300,
    oneYearGrowthPct: 9.7,
    demandScore: 85,
  },
  {
    city: "Noida",
    avgPricePerSqft: 9600,
    oneYearGrowthPct: 11.6,
    demandScore: 84,
  },
];

export const advisoryGuides = [
  {
    title: "How To Evaluate Builder Credibility Before Booking",
    summary: "Checklist for RERA history, delivery record, and legal due diligence.",
    href: "/tools/emi-calculator",
  },
  {
    title: "Budget Planning: Booking Amount, Stamp Duty, and Registration",
    summary: "Understand up-front cash outflow before finalizing your home.",
    href: "/tools/emi-calculator",
  },
  {
    title: "Investment Lens: Yield Vs Appreciation",
    summary: "When to prioritize monthly rental yield over long-term capital growth.",
    href: "/tools/emi-calculator",
  },
];

export function formatPriceCr(priceCr: number): string {
  return `Rs ${priceCr.toFixed(2)} Cr`;
}

export function getPropertyByIdOrSlug(idOrSlug: string): Property | undefined {
  return properties.find((property) => property.id === idOrSlug || property.slug === idOrSlug);
}

export function getFeaturedProperties(limit = 6): Property[] {
  return properties.filter((property) => property.isFeatured).slice(0, limit);
}

export function getCities(): string[] {
  return Array.from(new Set(properties.map((property) => property.city))).sort();
}

export function getInventoryStats() {
  const total = properties.length;
  const newLaunches = properties.filter((property) => property.isNewLaunch).length;
  const readyToMove = properties.filter((property) => property.status === "Ready to Move").length;
  const averagePriceCr =
    properties.reduce((acc, property) => acc + property.priceCr, 0) / Math.max(total, 1);

  return {
    total,
    newLaunches,
    readyToMove,
    averagePriceCr: Number(averagePriceCr.toFixed(2)),
  };
}

export function sortProperties(
  input: Property[],
  sortBy: "relevance" | "price_asc" | "price_desc" | "rating_desc" | "new_launch" = "relevance",
): Property[] {
  const items = [...input];
  if (sortBy === "price_asc") {
    return items.sort((a, b) => a.priceCr - b.priceCr);
  }
  if (sortBy === "price_desc") {
    return items.sort((a, b) => b.priceCr - a.priceCr);
  }
  if (sortBy === "rating_desc") {
    return items.sort((a, b) => b.rating - a.rating);
  }
  if (sortBy === "new_launch") {
    return items.sort((a, b) => {
      const aScore = a.isNewLaunch ? 1 : 0;
      const bScore = b.isNewLaunch ? 1 : 0;
      if (aScore === bScore) return b.rating - a.rating;
      return bScore - aScore;
    });
  }
  return items;
}

export function filterProperties(filters: PropertyFilters): Property[] {
  const normalizedKeyword = (filters.keyword || "").trim().toLowerCase();
  const filtered = properties.filter((property) => {
    if (filters.city && filters.city !== "All" && property.city !== filters.city) {
      return false;
    }
    if (filters.type && filters.type !== "All" && property.type !== filters.type) {
      return false;
    }
    if (filters.bhk && filters.bhk > 0 && property.bhk !== filters.bhk) {
      return false;
    }
    if (filters.minPriceCr && property.priceCr < filters.minPriceCr) {
      return false;
    }
    if (filters.maxPriceCr && property.priceCr > filters.maxPriceCr) {
      return false;
    }
    if (!normalizedKeyword) {
      return true;
    }

    const haystack = [
      property.name,
      property.city,
      property.locality,
      property.builder,
      property.summary,
      ...property.highlights,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedKeyword);
  });
  return sortProperties(filtered, filters.sortBy);
}
