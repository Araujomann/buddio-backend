import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/buddioDB");
        console.log("mongoDB conectado com sucesso!");
    } catch (error) {
        console.log("Erro ao conectar com o mongoDB:", error.message);
        process.exit(1);
    }
};
