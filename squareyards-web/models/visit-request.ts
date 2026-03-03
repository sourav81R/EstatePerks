import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const VisitRequestSchema = new Schema(
  {
    propertyId: { type: String, required: true, index: true },
    propertyName: { type: String, required: true },
    city: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    preferredDate: { type: String, required: true },
    timeSlot: { type: String, required: true, enum: ["Morning", "Afternoon", "Evening"] },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type VisitRequestDocument = InferSchemaType<typeof VisitRequestSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const VisitRequestModel =
  (models.VisitRequest as Model<VisitRequestDocument>) || model("VisitRequest", VisitRequestSchema);
