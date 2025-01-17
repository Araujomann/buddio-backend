import { verifyJWT } from "../middlewares/auth.js";
import { Conversation } from "../models/Conversation.js";

import { Message } from "../models/Message.js";

export async function conversationRoutes(fastify, options) {
  fastify.get("/", { preHandler: [verifyJWT] }, async (req, reply) => {
    const userId = req.user.id;

    try {
      let conversations = await Conversation.find({
        participants: userId,
      })
        .populate("participants", "profileImage username")
        .sort({ "lastMessage.timestamp": -1 });
      console.log(conversations);
      return reply.send(conversations);
    } catch (error) {
      reply.code(500).send({ error: error.message });
      console.log(error.message);
    }
  });

  fastify.post(
    "/:receiverId",
    { preHandler: [verifyJWT] },
    async (req, reply) => {
      const senderId = req.user.id;
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
        reply.send({
          conversationId: conversation._id,
          startedAt: conversation.startedAt,
        });
      } catch (error) {
        reply.code(500).send({ error: error.message });
        console.log(error.message);
      }
    },
  );

  fastify.post("/lastMessage", async (req, reply) => {
    const { conversationId, message } = req.body;
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return reply.code(404).send({ error: "Conversa não encontrada" });
      }
      conversation.lastMessage = {
        text: message,
        timestamp: Date.now(),
      };
      await conversation.save();
      reply.send({ message: "Última mensagem atualizada com sucesso." });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // // fastify.post("/messages", async (req, reply) => {
  // //     const { conversationId, senderId, message } = req.body;

  // //     try {
  // //         const newMessage = new Message({
  // //             conversationId,
  // //             senderId,
  // //             message,
  // //             timestamp: Date.now(),
  // //         });
  // //         await newMessage.save();

  // //         const conversation = await Conversation.findById(conversationId);
  // //         if (!conversation) {
  // //             return reply
  // //                 .code(404)
  // //                 .send({ error: "Conversation not found" });
  // //         }

  // //         conversation.lastMessage = {
  // //             text: message,
  // //             timestamp: newMessage.timestamp,
  // //         }

  // //         if (!conversation.startedAt) {
  // //             conversation.startedAt = Date.now();
  // //         }

  // //         await conversation.save();

  // //         const participants = conversation.participants;

  // //         participants.forEach((participantId) => {
  // //             const clientSocket = clients.get(participantId);
  // //             if (clientSocket) {
  // //                 clientSocket.send(
  // //                     JSON.stringify({
  // //                         conversationId,
  // //                         senderId,
  // //                         message: newMessage.message,
  // //                     })
  // //                 );
  // //             }
  // //         });

  // //         reply.send({ messageId: newMessage._id });
  // //     } catch (error) {
  // //         reply.code(500).send({ error: error.message });
  // //         console.log(error.message);
  // //     }
  // // });

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

  fastify.get("/:conversationId/preferences", async (req, reply) => {
    const { conversationId } = req.params;

    try {
      const preferences = await Conversation.findById(
        conversationId,
        "chatBackground",
      );
      reply.send(preferences);
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.put("/:conversationId/chat-background", async (req, reply) => {
    try {
      const { conversationId } = req.params;
      const { chatBackground } = req.body;

      if (!chatBackground) {
        return reply.code(400).send({ message: "Nenhum fundo foi fornecido." });
      }

      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { chatBackground },
        { new: true },
      );

      if (!updatedConversation) {
        return reply.status(404).send({ message: "Conversa não encontrada." });
      }

      reply.status(200).send({
        message: "Fundo da conversa atualizado com sucesso.",
        chatBackground: updatedConversation.chatBackground,
      });
    } catch (error) {
      reply.status(500).send({ message: "Erro ao atualizar o fundo.", error });
    }
  });
}
