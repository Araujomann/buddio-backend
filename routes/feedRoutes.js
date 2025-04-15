import { verifyJWT } from "../middlewares/auth.js";
import { Post } from "../models/Post.js";
import { Follow } from "../models/Follow.js";

export async function feedRoutes(fastify, options) {
    fastify.get("/posts", { preHandler: [verifyJWT] }, async (req, reply) => {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        try {
            const following = await Follow.find({ followerId: userId }).select(
                "followedId"
            );

            following.push({ followedId: userId });

            const followedIds = following.map((follow) =>
                follow.followedId.toString()
            );

            const posts = await Post.find({ user: { $in: followedIds } })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("user", "username");

            const totalPosts = await Post.countDocuments({
                user: { $in: followedIds },
            });
            const totalPages = Math.ceil(totalPosts / limit);

            const postsWithLikesStatus = posts.map((post) => ({
                ...post.toObject(),
                isLiked: post.likes.includes(userId),
            }));

            return reply.send({
                posts: postsWithLikesStatus,
                pagination: {
                    totalPosts,
                    totalPages,
                    currentPage: Number(page),
                    hasNextPage: Number(page) < totalPages,
                },
            });
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
