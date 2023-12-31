import { Schema, model } from "mongoose";

let blockSchema = new Schema(
    {
        ip: String
    },
    {
        timestamps: true,
    }
);

export default model("block", blockSchema);