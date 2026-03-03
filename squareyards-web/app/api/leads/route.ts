import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { getPropertyByIdOrSlug } from "@/lib/properties";
import { LeadPayload } from "@/lib/types";
import { LeadModel } from "@/models/lead";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;

export async function GET() {
  try {
    await connectToDatabase();
    const [total, recentLeads] = await Promise.all([
      LeadModel.countDocuments({}),
      LeadModel.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return NextResponse.json({
      total,
      recentLeads: recentLeads.map((lead) => ({
        id: String(lead._id),
        propertyId: lead.propertyId,
        propertyName: lead.propertyName,
        city: lead.city,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        createdAt: lead.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch leads." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<LeadPayload>;
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();
    const propertyId = String(payload.propertyId || "").trim();
    const message = String(payload.message || "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Valid name is required." }, { status: 400 });
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
    }

    const property = getPropertyByIdOrSlug(propertyId);
    if (!property) {
      return NextResponse.json({ error: "Invalid property selected." }, { status: 400 });
    }

    await connectToDatabase();
    const lead = await LeadModel.create({
      propertyId: property.id,
      propertyName: property.name,
      city: property.city,
      name,
      email,
      phone,
      message,
    });

    return NextResponse.json(
      {
        ok: true,
        leadId: String(lead._id),
        message: "Your request has been submitted. Our advisor will contact you shortly.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit lead." },
      { status: 500 },
    );
  }
}
