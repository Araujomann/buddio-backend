import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

followSchema.index({followerId: 1})
followSchema.index({followingId: 1})


export const Follow = mongoose.model("Follow", followSchema)