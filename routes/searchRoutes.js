import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { verifyJWT } from "../middlewares/auth.js";


export async function searchRoutes(fastify, options) {
    fastify.get("/users", { preHandler: [verifyJWT] }, async (req, reply) => {
        const { query } = req.query;
        try {
            const users = await User.find({
                username: { $regex: query, $options: "i" },
            }).select("username profileImage");

            const usersWithPosts = await Promise.all(
                users.map(async (user) => {
                    const twoPosts = await Post.find({
                        user: user._id
                    })
                    .sort({createdAt: -1})
                    .limit(2)

                    return {
                        ...user.toObject(),
                        posts: twoPosts
                    }
                })
            )

                    console.log(usersWithPosts)
            return reply.send(usersWithPosts)
        
        } catch (error) {
            reply.status(500).send({ error: error.message });
            console.log(error.message);
        }
    });


    fastify.get("/profile/:userId", { preHandler: [verifyJWT] }, async (req, reply) => {
        try {
            const { userId } = req.params

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
    
}
