import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Message } from "./models/Message.js";
import { connectDB } from "./db.js";
import { postRoutes } from "./routes/postRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { feedRoutes } from "./routes/feedRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";
import { followRoutes } from "./routes/followRoutes.js";
import { conversationRoutes } from "./routes/conversationRoutes.js";
import fastifyMultipart from "@fastify/multipart";

const fastify = Fastify({ logger: true });

dotenv.config();

fastify.register(cors, {
  origin: "*",
});

connectDB();

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

fastify.register(postRoutes, { prefix: "/posts" });
fastify.register(userRoutes, { prefix: "/user" });
fastify.register(profileRoutes, { prefix: "/profile" });
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(feedRoutes, { prefix: "/feed" });
fastify.register(searchRoutes, { prefix: "/search" });
fastify.register(followRoutes);
fastify.register(conversationRoutes, { prefix: "/conversations" });

const server = fastify.server;
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error("Token não fornecido"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (error) {
    console.error("Erro na autenticação do WebSocket:", error.message);
    next(new Error("Token inválido"));
  }
});

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.user.id);

  socket.on("joinConversation", async (conversationId) => {
    try {
      socket.join(conversationId);
      console.log(
        `Usuário ${socket.user.id} entrou na conversa: ${conversationId}`,
      );

      const messages = await Message.find({ conversationId }).sort({
        timestamp: 1,
      });
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  });

  socket.on(
    "sendMessage",
    async ({ conversationId, senderId, message, timestamp }) => {
      const time = new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      try {
        const newMessage = new Message({
          conversationId,
          senderId,
          message,
          time,
        });
        await newMessage.save();

        io.to(conversationId).emit("receiveMessage", {
          conversationId,
          senderId,
          message: newMessage.message,
        });
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log("Servidor rodando na porta 5000");
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
