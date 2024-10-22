import jwt from 'jsonwebtoken';

export async function verifyJWT(req, reply) {
    try {
       const authHeader = req.headers.authorization;
       if(!authHeader) {
        reply.code(401).send({error: "Token não fornecido"})
        return;
       }

       const token = authHeader.split(' ')[1];
       if(!token) {
        reply.code(401).send({error: "Token não fornecido"})
        return;
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       console.log("decoded: ", decoded)
       if(!decoded.id){
        reply.code(400).send({error: "Usuário não encontrado no token"})
        return;
       }

       req.user = decoded;
    } catch (error) {
        reply.code(401).send({error: error.message})
    }
}