import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import admin from "firebase-admin";
import crypto from "crypto";
import { fileURLToPath } from 'url';

admin.initializeApp({
  projectId: "buddio2"
});

export async function authRoutes(fastify, options) {
  dotenv.config();

  fastify.post("/google", async (req, reply) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return reply.code(400).send({ error: "Token não fornecido" });
      }

      let decodedToken;
      try {
         decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (err) {
         console.error("Erro ao verificar token do firebase:", err);
         return reply.code(401).send({ error: "Token inválido ou expirado" });
      }

      const { email, name, picture } = decodedToken;
      
      let user = await User.findOne({ email });

      if (!user) {
        let baseUsername = name ? name.replace(/\s+/g, '') : email.split('@')[0];
        let username = baseUsername;
        let usernameExists = await User.findOne({ username });
        while (usernameExists) {
            username = baseUsername + crypto.randomBytes(2).toString("hex");
            usernameExists = await User.findOne({ username });
        }
        
        user = new User({
          username,
          email,
          verifiedEmail: true,
          authProvider: "google",
          profileImage: picture || "https://res.cloudinary.com/dkhosxear/image/upload/v1735048989/Captura_de_tela_2024-12-24_105753_ltu7jz.png"
        });
        await user.save();
      }

      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "16h",
      });

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return reply.send({ accessToken, refreshToken });
    } catch (error) {
       console.error(error);
       return reply.code(500).send({ error: error.message });
    }
  });

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
