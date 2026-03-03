import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const NewsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    source: { type: String, default: "website" },
    status: { type: String, default: "active" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type NewsletterSubscriberDocument = InferSchemaType<typeof NewsletterSubscriberSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const NewsletterSubscriberModel =
  (models.NewsletterSubscriber as Model<NewsletterSubscriberDocument>) ||
  model("NewsletterSubscriber", NewsletterSubscriberSchema);
