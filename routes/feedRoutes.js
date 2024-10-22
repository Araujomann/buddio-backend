import { Post } from "../models/Post.js";

export async function feedRoutes (fastify, options) {
    fastify.get("/posts", async (req, reply) => {
        try {
            const posts = await Post.find().populate("user", "username").sort({createdAt: -1})
            return reply.send(posts)


        } catch (error) {
            console.log(error)
            reply.code(500).send({error})
            
        }
    })
}