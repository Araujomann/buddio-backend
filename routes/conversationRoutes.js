import { verifyJWT } from "../middlewares/auth.js";
import { Conversation } from "../models/Conversation.js";
import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";
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

  fastify.get("/start-chat/:query", { preHandler: [verifyJWT] }, async (req, reply) => {

    const userId = req.user.id
    const { query } = req.params

    try {
      const follows = await Follow.find({ followerId: userId})
      // .populate({
      //   path: 'followedId',
      //   model: 'User',
      //   select: 'username profileImage',
      //   match: {
      //     username: { $regex: query, $options: 'i'}
      //   }
      // })


      // const matchedUsers = follows
      // .filter(follow => follow.followedId !== null)
      // .map(follow => follow.followedId)


      // return reply.send(matchedUsers)

      const followedsIds = follows.map(follow => follow.followedId)

      const matchedUsers = await User.find({
        _id: { $in: followedsIds},
        username: {$regex: query, $options: 'i'}
      }).select('username profileImage')

      reply.send(matchedUsers)
      
    } catch (error) {
      reply.code(500).send({ error: error.message });
      console.log(error.message);
    }
  })

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
