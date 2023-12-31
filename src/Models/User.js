import { Schema, model } from "mongoose";

let userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: false,
        },
        password: {
            type: String,
            required: true,
        },
        number: {
            type: String,
            unique: false,
            default: ""
        },
        mail: {
            type: String,
            required: true,
            unique: true,
        },
        cart: [
            {
                furniture: {
                    type: Schema.Types.ObjectId,
                    ref: "furniture",
                },
                count: {
                    type: Number,
                    min: 1,
                    default: 1
                }
            },
        ],
        address: String,
        role: {
            type: String,
            required: true,
            default: "user",
        },
        historyOfBye: [
            {
                type: Schema.Types.ObjectId,
                ref: "purchase",
            },
        ],
        historyOfview: [
            {
                type: Schema.Types.ObjectId,
                ref: "furniture",
            },
        ],
        isBlocked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export default model("user", userSchema);
