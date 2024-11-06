import mongoose from 'mongoose';
import { Post } from './models/Post.js'; // Ajuste o caminho conforme necessário

// Conecte-se ao banco de dados
const MONGO_URI = 'mongodb://localhost:27017/seu_banco_de_dados'; // Altere para a URI correta do seu banco de dados
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB"))
    .catch((error) => console.error("Erro de conexão:", error));

async function updateLikesField() {
    try {
        // Atualiza todos os documentos para remover o campo `likes` como número e substituí-lo por um array vazio
        const result = await Post.updateMany(
            { likes: { $type: "number" } },   // Encontra documentos onde `likes` é do tipo número
            { $set: { likes: [] } }           // Define `likes` como um array vazio
        );

        console.log(`Documentos atualizados: ${result.modifiedCount}`);
    } catch (error) {
        console.error("Erro ao atualizar os documentos:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Executa o script de atualização
updateLikesField();
