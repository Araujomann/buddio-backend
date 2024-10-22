import Fastify from 'fastify'; 
import cors from '@fastify/cors';
import{ connectDB } from './db.js';
import {postRoutes}  from './routes/postRoutes.js';
import {registerRoutes} from './routes/registerRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { feedRoutes } from './routes/feedRoutes.js';
import fastifyMultipart from '@fastify/multipart'; 

const fastify = Fastify({ logger: true }); 


fastify.register(cors, { 
  origin: '*' 
});

connectDB();

fastify.register(fastifyMultipart);


fastify.register(postRoutes, { prefix: "/posts" });
fastify.register(registerRoutes, { prefix: "/user"})
fastify.register(authRoutes, { prefix: "/auth"});
fastify.register(feedRoutes, { prefix: "/feed"});


const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log("Servidor rodando na porta 5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
