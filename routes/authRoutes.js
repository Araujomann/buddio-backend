import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

export async function authRoutes(fastify, options) {
  dotenv.config();

  fastify.post("/login", async (req, reply) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return reply.code(400).send({ error: "Usuário não encontrado" });
      }

      if (!user.verifiedEmail) {
        return reply
          .code(400)
          .send({ error: "Email não verificado. Verifique seu email." });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.code(401).send({ error: "Senha incorreta" });
      }

      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "16h",
      });

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        },
      );

      return reply.send({ accessToken, refreshToken });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post("/logout", async (req, reply) => {
    try {
      reply.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      return reply.send({ message: "Logout sucessful" });
    } catch (error) {
      console.error(error);
    }
  });
}
