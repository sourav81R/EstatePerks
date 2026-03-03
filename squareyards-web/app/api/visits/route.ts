import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { getPropertyByIdOrSlug } from "@/lib/properties";
import { VisitPayload } from "@/lib/types";
import { VisitRequestModel } from "@/models/visit-request";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;

export async function GET() {
  try {
    await connectToDatabase();
    const [total, visits] = await Promise.all([
      VisitRequestModel.countDocuments({}),
      VisitRequestModel.find({}).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return NextResponse.json({
      total,
      visits: visits.map((visit) => ({
        id: String(visit._id),
        propertyId: visit.propertyId,
        propertyName: visit.propertyName,
        city: visit.city,
        name: visit.name,
        phone: visit.phone,
        email: visit.email,
        preferredDate: visit.preferredDate,
        timeSlot: visit.timeSlot,
        notes: visit.notes,
        createdAt: visit.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch visit requests." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<VisitPayload>;
    const propertyId = String(payload.propertyId || "").trim();
    const name = String(payload.name || "").trim();
    const phone = String(payload.phone || "").trim();
    const email = String(payload.email || "")
      .trim()
      .toLowerCase();
    const preferredDate = String(payload.preferredDate || "").trim();
    const timeSlot = String(payload.timeSlot || "").trim();
    const notes = String(payload.notes || "").trim();

    if (!propertyId) {
      return NextResponse.json({ error: "Property is required." }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: "Valid name is required." }, { status: 400 });
    }
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
    }
    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 });
    }
    if (!preferredDate) {
      return NextResponse.json({ error: "Preferred date is required." }, { status: 400 });
    }
    if (!["Morning", "Afternoon", "Evening"].includes(timeSlot)) {
      return NextResponse.json({ error: "Please choose a valid time slot." }, { status: 400 });
    }

    const property = getPropertyByIdOrSlug(propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    await connectToDatabase();
    const visit = await VisitRequestModel.create({
      propertyId: property.id,
      propertyName: property.name,
      city: property.city,
      name,
      phone,
      email,
      preferredDate,
      timeSlot,
      notes,
    });

    return NextResponse.json(
      {
        ok: true,
        visitId: String(visit._id),
        message: "Visit request submitted. Advisor will confirm your slot shortly.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit visit request." },
      { status: 500 },
    );
  }
}
