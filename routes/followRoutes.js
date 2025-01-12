import { verifyJWT } from "../middlewares/auth.js";
import { Follow } from "../models/Follow.js";

export async function followRoutes(fastify, options) {
  fastify.post(
    "/follow/:id",
    { preHandler: [verifyJWT] },
    async (req, reply) => {
      try {
        const followedId = req.params.id;
        const followerId = req.user.id;

        const existingFollow = await Follow.findOne({
          followerId,
          followedId,
        });

        if (existingFollow) {
          return reply.status(400).send({
            message: "Você já está seguindo esse usuário.",
          });
        }

        const follow = new Follow({ followerId, followedId });
        await follow.save();

        return reply.send({ message: "Seguindo usuário.", isFollowing: true });
      } catch (error) {
        console.error("Erro ao seguir usuário: ", error);
      }
    },
  );

  fastify.delete(
    "/follow/:id",
    { preHandler: [verifyJWT] },
    async (req, reply) => {
      try {
        const followedId = req.params.id;
        const followerId = req.user.id;

        const deletedFollow = await Follow.findOneAndDelete({
          followerId,
          followedId,
        });

        if (!deletedFollow) {
          return reply.status(404).send({
            message: "Você não está seguindo esse usuário.",
          });
        }

        return reply.send({
          message: "Deixou de seguir o usuário.",
          isFollowing: false,
        });
      } catch (error) {
        console.error("Erro ao deixar de seguir usuário: ", error);
        return reply.status(500).send({ message: error.message });
      }
    },
  );

  fastify.get("/followers", { preHandler: [verifyJWT] }, async (req, reply) => {
    try {
      const userId = req.user.id;

      const followers = await Follow.find({
        followedId: userId,
      }).populate("followerId", "username profileImage");
      reply.send(followers.map((follow) => follow.followerId));
    } catch (error) {
      console.error("Erro ao buscar seguidores: ", error);
      reply.status(500).send({ message: error.message });
    }
  });

  fastify.get(
    "/isFollowing/:followedId",
    { preHandler: [verifyJWT] },
    async (req, reply) => {
      try {
        const followerId = req.user.id;
        const { followedId } = req.params;

        const isFollowing = await Follow.exists({ followerId, followedId });

        reply.send({ isFollowing: Boolean(isFollowing) });
      } catch (error) {
        console.error("Erro ao verificar se está seguindo: ", error);
        reply.status(500).send({ message: error.message });
      }
    },
  );

  fastify.get(
    "/user/following",
    { preHandler: [verifyJWT] },
    async (req, reply) => {
      try {
        const followerId = req.user.id;
        const following = await Follow.find({ followerId }).select(
          "followedId",
        );

        const followedIds = following.map((follow) =>
          follow.followedId.toString(),
        );

        reply.send(followedIds);
      } catch (error) {
        console.error("Erro ao buscar seguidores: ", error);
        reply.status(500).send({ message: error.message });
      }
    },
  );
}
