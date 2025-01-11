import { User } from "../models/User.js";
import { verifyJWT } from "../middlewares/auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function userRoutes(fastify, options) {
  fastify.post("/register", async (req, reply) => {
    const { username, email, password, authProvider } = req.body;
    let verifiedEmail = false;

    try {
      const existingUser = await User.findOne({ username });
      const existingEmail = await User.findOne({ email });
      if (existingUser) {
        return reply
          .code(409)
          .send({ Error: "Este nome de usuário já existe." });
      }

      if (existingEmail) {
        return reply.code(409).send({ Error: "Este email já está em uso." });
      }

      if (authProvider === "google") {
        verifiedEmail = true;
      }

      const confirmationCode = crypto.randomBytes(20).toString("hex");

      const newUser = new User({
        username,
        email,
        password,
        confirmationCode,
        verifiedEmail,
        authProvider,
      });
      await newUser.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_OWNER,
          pass: process.env.PASS,
        },
      });

      if (authProvider !== "google") {
        const mailOptions = {
          from: process.env.EMAIL_OWNER,
          to: email,
          subject: "Confirmação de E-mail",
          html: `
                        <div style="text-align: center;">
                    <h1 style="font-size: 32px; color: #333;">Confirmação de Cadastro</h1>
                    <p style="font-size: 24px; color: #555;">Olá ${username}, por favor, confirme seu cadastro clicando no link. </p>
                    <p style="font-size: 20px; color: #555;">https://buddio-backend-production.up.railway.app/user/confirm-email/${confirmationCode}</p>
                   </div>
                    `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error.message);
          }
          console.log("Email enviado: " + info.response);
        });

        reply.code(200).send({
          message:
            "Registro bem-sucedido! Verifique seu email para confirmar a conta.",
        });
      }
      reply.code(200).send({
        message: "Registro bem-sucedido! Email confirmado automaticamente.",
      });
    } catch (error) {
      if (error.code === 11000) {
        console.log(error);
        return reply.status(409).send({ error: error.message });
      }

      reply.code(500).send({ error: "Erro ao registrar o usuário" });
      console.error("Erro no servidor: ", error.message);
    }
  });

  fastify.post("/resend-email", async (req, reply) => {
    const { email, username } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return reply.code(404).send({ error: "Usuário não encontrado" });
      }

      const newConfirmationCode = crypto.randomBytes(20).toString("hex");

      user.confirmationCode = newConfirmationCode;

      await user.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_OWNER,
          pass: process.env.PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_OWNER,
        to: email,
        subject: "Confirmação de E-mail",
        html: `
                    <div style="text-align: center;">
                <h1 style="font-size: 32px; color: #333;">Confirmação de Cadastro</h1>
                <p style="font-size: 24px; color: #555;">Olá ${username}, por favor, confirme seu cadastro clicando no link. </p>
                <p style="font-size: 20px; color: #555;">http://localhost:5000/user/confirm-email/${newConfirmationCode}</p>
               </div>
                `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error.message);
        }
        console.log("Email enviado: " + info.response);
      });
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reenviar o email" });
      console.error("Erro no servidor: ", error.message);
    }
  });

  fastify.get("/confirm-email/:confirmationCode", async (req, reply) => {
    const { confirmationCode } = req.params;

    try {
      const user = await User.findOne({
        confirmationCode: confirmationCode,
      });
      if (!user) {
        return reply.code(404).send({ error: "Token inválido ou expirado!" });
      }

      user.verifiedEmail = true;
      user.confirmationCode = null;

      await user.save();

      reply.code(200).send({ message: "Email confirmado com sucesso!" });
    } catch (error) {
      reply.code(500).send({ error: "Erro ao confirmar o email" });
      console.error("Erro no servidor: ", error.message);
    }
  });

  fastify.get("/", async (req, reply) => {
    try {
      const users = await User.find();
      reply.code(200).send(users);
    } catch (error) {
      reply.code(500).send({ error: "Erro ao buscar os usuários" });
      console.log("Erro no servidor: ", error);
    }
  });
}
