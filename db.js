import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
    try {
        // conexão com opções adicionais de estabilidade
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
        });
        console.log("mongoDB conectado com sucesso!");

        mongoose.connection.on("error", (err) => {
            console.log("Erro de conexão com o mongoDB:", err.message);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("Conexão com o MongoDB foi encerrada.");
        });
    } catch (error) {
        console.log("Erro ao conectar com o mongoDB:", error.message);
        process.exit(1);
    }
};
