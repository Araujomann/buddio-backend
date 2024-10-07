import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

export async function loginRoutes(fastify, options) {
    dotenv.config();

    fastify.post("/login", async (req, reply) => {
        try {
            const { email, password } = req.body;
            console.log(">>>>>>>> ", req.body);
            const user = await User.findOne({ email });
            console.log("user: ", user);
            if (!user) {
                return reply
                    .code(400)
                    .send({ error: "Usuário não encontrado" });
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return reply.code(400).send({ error: "Senha incorreta" });
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });
            console.log("token: ", token);

            return reply.send({ token });
        } catch (error) {
            return reply.code(500).send({ error: "Erro ao fazer login" });
        }
    });
}
