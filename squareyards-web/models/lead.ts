import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const LeadSchema = new Schema(
  {
    propertyId: { type: String, required: true, index: true },
    propertyName: { type: String, required: true },
    city: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    message: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type LeadDocument = InferSchemaType<typeof LeadSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const LeadModel = (models.Lead as Model<LeadDocument>) || model("Lead", LeadSchema);
