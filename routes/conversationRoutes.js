import { verifyJWT } from "../middlewares/auth.js";
import { Conversation } from "../models/Conversation.js";

import { Message } from "../models/Message.js";

export async function conversationRoutes(fastify, options) {
    fastify.post("/:receiverId",{preHandler : [verifyJWT]}, async (req, reply) => {
        const  senderId  = req.user.id;
        const receiverId = req.params.receiverId;

        try {
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] },
            });

            if (!conversation) {
                conversation = new Conversation({
                    participants: [senderId, receiverId],
                    startedAt: Date.now(),
                });

                
                await conversation.save();


            }
            reply.send({ conversationId: conversation._id, startedAt: conversation.startedAt });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    fastify.post("/messages", async (req, reply) => {
        const { conversationId, senderId, message } = req.body;

        try {
            const newMessage = new Message({
                conversationId,
                senderId,
                message,
                timestamp
            });

            await newMessage.save();

            const conversation = await Conversation.findById(conversationId);

            if (!conversation) {
                return reply
                    .code(404)
                    .send({ error: "Conversation not found" });
            }

            if(!conversation.startedAt){
                conversation.startedAt = Date.now();
                await conversation.save();
            }


            const participants = conversation.participants;

            participants.forEach((participantId) => {
                const clientSocket = clients.get(participantId);
                if (clientSocket) {
                    clientSocket.send(
                        JSON.stringify({
                            conversationId,
                            senderId,
                            message: newMessage.message,
                        })
                    );
                }
            });

            reply.send({ messageId: newMessage._id });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    fastify.get("/messages/:conversationId", async (req, reply) => {
        const { conversationId } = req.params;
        

        try {
            const messages = await Message.find({ conversationId }).sort({
                timestamp: 1,
            });
            reply.send(messages);
        } catch (err) {
            reply.code(500).send({ error: err.message });
        }
    });
}
