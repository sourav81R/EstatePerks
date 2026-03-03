import { NextRequest, NextResponse } from "next/server";

import { filterProperties, getCities, getInventoryStats } from "@/lib/properties";
import { PropertyType } from "@/lib/types";

function parsePrice(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const city = searchParams.get("city") || undefined;
  const keyword = searchParams.get("q") || undefined;
  const type = (searchParams.get("type") as PropertyType | "All" | null) || undefined;
  const bhkRaw = Number(searchParams.get("bhk"));
  const bhk = Number.isFinite(bhkRaw) && bhkRaw > 0 ? bhkRaw : undefined;
  const minPriceCr = parsePrice(searchParams.get("minPriceCr"));
  const maxPriceCr = parsePrice(searchParams.get("maxPriceCr"));

  const result = filterProperties({
    city,
    keyword,
    type,
    bhk,
    minPriceCr,
    maxPriceCr,
  });

  return NextResponse.json({
    properties: result,
    total: result.length,
    filters: {
      cities: ["All", ...getCities()],
      types: ["All", "Apartment", "Villa", "Plot", "Office"],
      bhk: [1, 2, 3, 4],
    },
    stats: getInventoryStats(),
  });
}
