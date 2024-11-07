import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { verifyJWT } from "../middlewares/auth.js";
import { cloudinary } from "../cloudinary.js";

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

            reply.code(201).send(newPost);
        } catch (error) {
            console.error("Erro no servidor: ", error);
            reply
                .code(500)
                .send({ error: "Erro ao criar a postagem: " + error.message });
        }
    });

    fastify.post("/upload", { preHandler: [verifyJWT] }, async (req, reply) => {
        try {
            const file = await req.file();

            if (!file) {
                return reply
                    .status(400)
                    .send({ error: "Nenhuma imagem enviada" });
            }

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "buddio uploads" },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                file.file.pipe(uploadStream);
            });

            const imageUrl = result.secure_url;
            const decodedUser = req.user;

            if (!decodedUser || !decodedUser.id) {
                return reply
                    .code(400)
                    .send({ error: "Usuário não encontrado no token" });
            }

            const newPost = new Post({ imageUrl, user: decodedUser.id });
            const saved = await newPost.save();

            reply.code(201).send({
                message: "Upload e criação de post realizados com sucesso",
                url: result.secure_url,
                newPost: saved,
            });
        } catch (error) {
            console.error("Erro no servidor: ", error);
            reply.status(500).send({
                error: "Erro ao fazer o upload do arquivo: " + error.message,
            });
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

    fastify.put(
        "/:postId/like",
        { preHandler: [verifyJWT] },
        async (req, reply) => {
            const { postId } = req.params;
            const userId = req.user.id;

            try {
                const post = await Post.findById(postId);
                if (!post) {
                    return reply
                        .code(404)
                        .send({ error: "Post não encontrado" });
                }

                const somePost = post.toObject();
                console.log("olha aquiii:", somePost);
                const Likeds = post.likes;
                const hasLiked = Likeds.includes(userId);

                if (hasLiked) {
                    post.likes.pull(userId);
                } else {
                    post.likes.push(userId);
                }

                await post.save();

                return reply.send({ success: true });
            } catch (error) {
                console.error("Erro no servidor: ", error);
                reply.code(500).send({ error: "Erro ao curtir a postagem" });
            }
        }
    );

    fastify.get(
        "/:userId/liked-posts",
        { preHandler: [verifyJWT] },
        async (req, reply) => {
            const { userId } = req.params
            try {
                const likedPosts = await Post.find({ likes: userId }).sort({
                    createdAt: -1
                });
                return reply.send(likedPosts);
            } catch (error) {
                console.error("Erro eu buscar posts curtidos: ", error);
                reply.status(500).send({ message: error.mensage });
            }
        }
    );
}
