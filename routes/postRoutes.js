import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { verifyJWT } from "../middlewares/auth.js";

export async function postRoutes(fastify, options) {
    fastify.post("/", { preHandler: [verifyJWT] }, async (req, reply) => {
        try {
            const { imageUrl } = req.body;
            const decodedUser = req.user;

            if (!decodedUser || !decodedUser.id) {
                return reply
                    .code(400)
                    .send({ error: "Usuário não encontrado no token" });
            }

            const newPost = new Post({ imageUrl, user: decodedUser.id });
            const saved = await newPost.save();
            console.log("post salvo: ", saved);
            reply.code(201).send(newPost);
        } catch (error) {
            console.error("Erro no servidor: ", error);
            reply
                .code(500)
                .send({ error: "Erro ao criar a postagem: " + error.message });
        }
    });

    fastify.get("/", async (req, reply) => {
        try {
            const posts = await Post.find();
            reply.code(200).send(posts);
        } catch (error) {
            reply.code(500).send({ error: "Erro ao buscar as postagens" });
        }
    });
}
