import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    startedAt: {
        type: Date
    }
})

export const Conversation = mongoose.model("Conversation", conversationSchema)