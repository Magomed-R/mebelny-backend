import { Schema, model } from "mongoose";

let manufacturerSchema = new Schema({
    manufacturer: String,
    sale: {
        type: Number,
        min: 0,
        max: 101,
        default: 0
    }
});

export default model("manufacturer", manufacturerSchema);
