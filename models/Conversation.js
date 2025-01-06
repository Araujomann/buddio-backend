import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    chatBackground: {
        type: String,
        default: "",
    },
    startedAt: {
        type: Date,
    },
    lastMessage: {
        text: {
            type: String,
            default: "",
        },
        timestamp: {
            type: Date,
            default: Date.now(),
        },
        
    },
});

export const Conversation = mongoose.model("Conversation", conversationSchema);
