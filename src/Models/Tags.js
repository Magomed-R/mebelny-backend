import { Schema, model } from "mongoose";

let tagSchema = new Schema({
    tag: String
});

export default model("tag", tagSchema);
