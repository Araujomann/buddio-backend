import { verifyJWT } from "../middlewares/auth.js"
import { Follow } from "../models/Follow.js"

export async function followRoutes (fastify, options) {
    fastify.post("/follow/:id", {preHandler: [verifyJWT] }, async (req, reply) => {
        const followerId = req.user._id
        const { followingId } = req.body

        const existingFollow = await Follow.findOne({followerId, followingId})
        if (existingFollow) {
            return reply.status(400).send({message: "Você já está seguindo esse usuário."})
        }

        const follow = new Follow({followerId, followingId})
        await follow.save()

        return reply.send({message: "Usuário seguido com sucesso."})
        })

        fastify.delete("/unfollow", {preHandler: [verifyJWT]}, async (req, reply) => {
            const followerId = req.user._id
            const { followingId } = req.body
    
            const deletedFollow = await Follow.findOneAndDelete({followerId, followingId})
            if(!deletedFollow) {
                return reply.status(404).send({message: "Você não está seguindo esse usuário."})
            }
             
            return reply.send({message: "Deixou de seguir o usuário."})
        })

        fastify.get("/followers/:userId", {preHandler: [verifyJWT]}, async (req, reply) => {
            const { userId} = req.params

            const followers = await Follow.find({followingId: userId}).populate("followerId", "username profileImage")
            reply.send(followers.map(follow => follow.followerId))
        })

    }
    
    
