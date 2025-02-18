import { verifyJWT } from "../middlewares/auth.js";
import { Post } from "../models/Post.js";
import { Follow } from "../models/Follow.js";

export async function feedRoutes(fastify, options) {
    fastify.get("/posts", { preHandler: [verifyJWT] }, async (req, reply) => {
        const userId = req.user.id;

        try {
            const following = await Follow.find({ followerId: userId }).select(
                "followedId"
            );

            const followedIds = following.map((follow) =>
                follow.followedId.toString()
            );

            const posts = await Post.find({ user: { $in: followedIds } })
                .sort({ createdAt: -1 })
                .populate("user", "username");

            const postsWithLikesStatus = posts.map((post) => ({
                ...post.toObject(),
                isLiked: post.likes.includes(userId),
            }));

            return reply.send(postsWithLikesStatus);
        } catch (error) {
            console.log(error);
            reply.code(500).send({ error: error.message });
        }
    });

    fastify.post(
        "/posts/:id/like",
        { preHandler: [verifyJWT] },
        async (req, reply) => {
            const postId = req.params.id;
            const userId = req.user.id;

            try {
                const post = await Post.findById(postId);

                if (!post) {
                    return reply
                        .code(404)
                        .send({ error: "Post não encontrado" });
                }

                const isLiked = post.likes.includes(userId);

                if (!isLiked) {
                    post.likes.push(userId);
                } else {
                    post.likes = post.likes.filter(
                        (id) => id.toString() !== userId
                    );
                }

                await post.save();

                reply.send({
                    isLiked: !isLiked,
                    likesCount: post.likes.length,
                });
            } catch (error) {
                reply.status(500).send({
                    message: "Erro ao curtir ou descurtir o post",
                    error: error.message,
                });
            }
        }
    );
}
