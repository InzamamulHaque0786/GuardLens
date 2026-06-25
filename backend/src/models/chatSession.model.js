import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'model'], required: true },
    text: { type: String, required: true }
});

const chatSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true, default: "New Chat" },
    messages: [messageSchema]
}, { timestamps: true });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);