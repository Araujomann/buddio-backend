import { User } from "../models/User.js";

export async function registerRoutes(fastify, options) {
    fastify.post("/register", async(req, reply) => {
        try {
            const { username, email, password} = req.body

            const existingUser = await User.findOne({ username })
            if(existingUser) {
                return reply.code(409).send({Error: "Este usuário já existe."})
            }
 
            const newUser = new User({ username, email, password })
            await newUser.save()

            reply.code(201).send({message: "Usuário criado com sucesso!"})
        } catch (error) {

            if(error.code === 11000) {
                return reply.code(409).send({error: "Este email já está em uso."})
            }

            reply.code(500).send({error: "Erro ao registrar o usuário"})
            console.error("Erro no servidor: ", error)
        }
    })

    fastify.get('/', async(req, reply) => {
        try {
            const users = await User.find()
            reply.code(200).send(users)
        } catch (error) {
            reply.code(500).send({error: "Erro ao buscar os usuários"})
            console.log("Erro no servidor: ", error)
        }
    }
)
}