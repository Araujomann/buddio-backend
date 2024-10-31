import { User } from "../models/User.js";
import { verifyJWT } from "../middlewares/auth.js";

export async function searchRoutes(fastify, options) {
    fastify.get("/users", { preHandler: [verifyJWT] }, async (req, reply) => {
        const { query } = req.query;
        try {
            const users = await User.find({
                username: { $regex: query, $options: "i" },
            }).select("username profileImage");
            reply.send(users);
        } catch (error) {
            reply.status(500).send({ error: error.message });
        }
    });
    ;
}
