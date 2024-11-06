import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [], required: true }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});
export const Post = mongoose.model("Post", postSchema);
