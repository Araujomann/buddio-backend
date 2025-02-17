import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            maxPoolSize: 10,
        });
        console.log("mongoDB conectado com sucesso!");
        }
    catch (error) {
        console.log("Erro ao conectar com o mongoDB:", error.message);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.connection.close()
        console.log("Conexão com o mongoDB encerrada!");

    } catch (error) {
        console.log("Erro ao tentar fechar conexão com mongoDB: ", error.message);
    }
    finally {
        process.exit(0);
    }

}

export { connectDB, disconnectDB };
