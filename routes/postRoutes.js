import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { verifyJWT } from "../middlewares/auth.js";
import { cloudinary } from '../cloudinary.js';



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


    fastify.post('/upload', {preHandler:[verifyJWT]}, async (req, reply) => {
        try {

            const file = await req.file();
    
            if (!file) {
                return reply.status(400).send({ error: 'Nenhuma imagem enviada' });
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
                file.file.pipe(uploadStream)
            });
    
            reply.send({ message: 'Upload realizado com sucesso', url: result.secure_url });

            const imageUrl = result.secure_url;
            const decodedUser = req.user;

            if (!decodedUser || !decodedUser.id) {
                return reply
                    .code(400)
                    .send({ error: "Usuário não encontrado no token" });
            } 

            const newPost = new Post({ imageUrl, user: decodedUser.id });
            const saved = await newPost.save();
            console.log("post salvo: ", saved)
            reply.code(201).send(newPost)



        } catch (error) {
            console.error("Erro no servidor: ", error);
            reply.status(500).send({ error: 'Erro ao fazer o upload do arquivo: ' + error.message });
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
