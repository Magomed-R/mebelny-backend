import { Schema, model } from "mongoose";

let furnitureSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: false
        },
        adminTitle: String,
        price: {
            type: Number,
            required: true,
        },
        preview: {
            type: String,
            default: ""
        },
        photos: [String],
        description: String,
        characteristics: [
            {
                name: {
                    type: String,
                    required: true,
                },
                text: {
                    type: String,
                    required: true,
                },
            },
        ],
        // views: {
        //     registred: {
        //         type: Number,
        //         default: 0,
        //     },
        //     unregistred: {
        //         type: Number,
        //         default: 0,
        //     }
        // },
        tags: {
            type: String,
            default: ""
        },
        manufacturer: {
            type:String,
            default: ""
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        sale: {
            type: Number,
            min: 0,
            max: 101,
            default: 0
        },
        discount: {
            type: Number,
            min: 0,
            max: 101,
            default: 0
        }
        // reviews: [
        //     {
        //         type: Schema.Types.ObjectId,
        //         ref: "Review",
        //     },
        // ],
    },
    {
        timestamps: true,
    }
);

export default model("furniture", furnitureSchema);
