import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("mongoDB conectado com sucesso!");
  } catch (error) {
    console.log("Erro ao conectar com o mongoDB:", error.message);
    process.exit(1);
  }
};
