import { NextResponse } from "next/server";

import { getPropertyByIdOrSlug } from "@/lib/properties";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const property = getPropertyByIdOrSlug(id);

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json({ property });
}
