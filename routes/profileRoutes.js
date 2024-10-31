import { verifyJWT } from "../middlewares/auth.js";
import fastifyMultipart from "fastify-multipart";
import { cloudinary } from "../cloudinary.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";

export async function profileRoutes(fastify, options) {
    fastify.get("/:userId", { preHandler: [verifyJWT] }, async (req, reply) => {
        try {
            console.log(req);
            const userId = req.user.id;
            const user = await User.findById(userId).select("-password");
            if (!user) {
                return reply
                    .code(404)
                    .send({ error: "Usuário não encontrado" });
            }

            const posts = await Post.find({ user: userId }).sort({
                createdAt: -1,
            });

            return reply.send({ user, posts });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    fastify.post(
        "/upload-profile",
        { preHandler: [verifyJWT] },
        async (req, reply) => {
            try {
                const data = await req.file();
                const userId = req.user.id;

                if (!data) {
                    return reply
                        .status(400)
                        .send({ error: "Nenhuma imagem enviada" });
                }

                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: "user-profiles",
                        },
                        async (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                    data.file.pipe(uploadStream);
                });

                await User.findByIdAndUpdate(userId, {
                    profileImage: result.secure_url,
                });
                reply.send({
                    message: "Upload realizado com sucesso",
                    url: result.secure_url,
                });

                reply.send({
                    message: "Imagem de perfil atualizada!",
                    url: result.secure_url,
                });

                const imageUrl = result.secure_url;
                const decodedUser = req.user;

                if (!decodedUser || !decodedUser.id) {
                    return reply
                        .code(400)
                        .send({ error: "Usuário não encontrado no token" });
                }

                const updatedUser = await User.findByIdAndUpdate(
                    decodedUser.id,
                    { profileImage: imageUrl }
                );
                const saved = await updatedUser.save();
                console.log("Usuário atualizado: ", saved);
                reply.code(201).send(updatedUser);
            } catch (error) {
                console.log("Erro no servidor: ", error);
                reply.code(500).send({
                    error:
                        "Erro ao atualizar a imagem de perfil: " +
                        error.message,
                });
            }
        }
    );

    fastify.put(
        "/user/update-profile",
        { preHandler: [verifyJWT] },
        async (req, reply) => {
            const { profileImage } = req.body;
            const decodedUser = req.user;

            if (!decodedUser || !decodedUser.id) {
                return reply
                    .code(400)
                    .send({ error: "Usuário não encontrado no token" });
            }

            try {
                await User.findByIdAndUpdate(decodedUser.id, { profileImage });
                reply.send({ message: "Imagem de perfil atualizada" });
            } catch (error) {
                console.error("Erro ao atualizar o perfil ", error);
                reply.code(500).send({
                    error: "Erro ao atualizar o perfil: " + error.message,
                });
            }
        }
    );
}
