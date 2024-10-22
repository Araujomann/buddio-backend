import { jwt } from "jsonwebtoken";

export async function tokenRoutes(fastify, options) {
    fastify.post("/token", async (req, reply) => {
        const { token } = req.body;

        if(!token) {
            return reply.status(401).send({ error: "refresh token não fornecido"})
        }

        try {
            const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

            const newAccessToken = jwt.sign({id: decoded.id}, process.env.JWT_SECRET, {
                expiresIn: "1h"
            });

            reply.send({ accessToken: newAccessToken });

        } catch (error) {
            console.error("Erro ao verificar o refresh token: ", error);
            reply.status(403).send({ error: error.message });
        }
    })
}