import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { NewsletterSubscriberModel } from "@/models/newsletter-subscriber";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    await connectToDatabase();
    const [total, subscribers] = await Promise.all([
      NewsletterSubscriberModel.countDocuments({ status: "active" }),
      NewsletterSubscriberModel.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return NextResponse.json({
      total,
      subscribers: subscribers.map((subscriber) => ({
        id: String(subscriber._id),
        email: subscriber.email,
        createdAt: subscriber.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch subscribers." },
      { status: 500 },
    );
  }
}

async function sendResendEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured." };
  }

  const fromAddress = process.env.NEWSLETTER_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.NEWSLETTER_FROM_NAME || "EstatePerks";
  const subject = process.env.NEWSLETTER_SUBJECT || "Welcome to EstatePerks updates";
  const from = `${fromName} <${fromAddress}>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html: `<p>Thanks for subscribing to EstatePerks.</p><p>You will receive fresh project launches, investment insights, and city market updates.</p>`,
      text: "Thanks for subscribing to EstatePerks. You will receive fresh project launches, investment insights, and city market updates.",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Resend error ${response.status}`);
  }

  return { sent: true };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = String(body.email || "").trim().toLowerCase();
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const existing = await NewsletterSubscriberModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "This email is already subscribed.",
      });
    }

    await NewsletterSubscriberModel.create({
      email,
      source: "website",
      status: "active",
    });

    const result = await sendResendEmail(email);
    return NextResponse.json({
      ok: true,
      message: result.sent
        ? "Subscribed successfully. Confirmation mail sent."
        : "Subscribed successfully. Email provider is not configured yet.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to subscribe right now." },
      { status: 500 },
    );
  }
}
