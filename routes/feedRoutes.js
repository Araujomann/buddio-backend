import { verifyJWT } from "../middlewares/auth.js";
import { Post } from "../models/Post.js";

export async function feedRoutes(fastify, options) {
  fastify.get("/posts", { preHandler: [verifyJWT] }, async (req, reply) => {
    const userId = req.user.id;
    try {
      const posts = await Post.find()
        .populate("user", "username")
        .sort({ createdAt: -1 });

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
          return reply.code(404).send({ error: "Post não encontrado" });
        }

        const isLiked = post.likes.includes(userId);

        if (!isLiked) {
          post.likes.push(userId);
        } else {
          post.likes = post.likes.filter((id) => id.toString() !== userId);
        }

        await post.save();

        reply.send({ isLiked: !isLiked, likesCount: post.likes.length });
      } catch (error) {
        reply
          .status(500)
          .send({
            message: "Erro ao curtir ou descurtir o post",
            error: error.message,
          });
      }
    },
  );
}
