import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

export async function authRoutes(fastify, options) {
    dotenv.config();

    fastify.post("/login", async (req, reply) => {
        try {
            const { email, password } = req.body;
            console.log(">>> Corpo da requisição: ", req.body);
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

            const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });

            const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: "7d",
            });

            
            console.log("accessToken: ", accessToken);
            console.log("refreshToken: ", refreshToken);
            
          

            return reply.send({ accessToken, refreshToken });
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.post("/logout", async (request, reply) => {
        try {
            reply
            .clearCookie("refreshToken", {
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
            })
            
            return reply.send({ message: "Usuário deslogado com sucesso" });
        } catch (error) {
            console.error(error);
        }
       
    });
}
