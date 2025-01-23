import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
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

fastify.addHook("onSend", (request, reply, payload, done) => {
    // reply.header("Cross-Origin-Opener-Policy", "same-origin");
    // reply.header("Cross-Origin-Embedder-Policy", "require-corp");
    done();
});

fastify.register(fastifyCors, {
    origin: ["https://buddio.vercel.app", "http://localhost:5173"],
    credentials: true,
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
        origin: [
            process.env.FRONTEND_URL,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5000",
        ],
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
        console.error("Erro na autenticação do WebSocket: ", error.message);
        next(new Error("Token inválido"));
    }
});

io.on("connection", (socket) => {
    console.log("Usuário conectado:", socket.user.id);

    socket.on("joinConversation", async (conversationId) => {
        try {
            socket.join(conversationId);

            const rooms = io.sockets.adapter.rooms;
            const onlineSockets = rooms.get(conversationId);

            if (onlineSockets) {
                const onlineUsers = [...onlineSockets].map((socketId) => {
                    const userSocket = io.sockets.sockets.get(socketId);
                    return userSocket.user.id;
                });

                socket.emit("currentOnlineUsers", onlineUsers);

                if (onlineUsers.length === 2) {
                    onlineUsers.forEach((userId) => {
                        io.to(conversationId).emit("updateOnlineStatus", {
                            userId: userId,
                            status: "online",
                        });
                    });
                }
                
            } else {
                console.log(
                    `Nenhuma sala encontrada para ID ${conversationId}`
                );
            }

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
        }
    );

    socket.on("disconnect", () => {
        console.log("Usuário desconectado:", socket.id);
        socket.broadcast.emit("updateOnlineStatus", {
            userId: socket.user.id,
            status: "offline",
        });
    });
});

const start = async () => {
    try {
        const port = process.env.PORT || 5000;
        await fastify.listen({ port, host: "0.0.0.0" });
        console.log(`Servidor rodando na porta ${port}`);
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};

start();
