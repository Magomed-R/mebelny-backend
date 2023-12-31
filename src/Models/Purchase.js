import { Schema, model } from "mongoose";

let purchaseSchema = new Schema(
    {
        ticket: {
            type: String,
            required: true,
        },
        buyer: {
            type: Schema.Types.ObjectId,
            ref: "user",
        },
        purchase: [
            {
                furniture: {
                    type: Schema.Types.ObjectId,
                    ref: "furniture",
                },
                count: {
                    type: Number,
                    min: 1,
                    default: 1,
                },
            },
        ],
        status: {
            type: String,
            default: "В обработке",
        },
    },
    {
        timestamps: true,
    }
);

export default model("purchase", purchaseSchema);
