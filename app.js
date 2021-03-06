const dotenv = require('dotenv');
const hpp = require('hpp');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const { MongoClient } = require('mongodb');
const { ApolloServer } = require('apollo-server-express');

const { typeDefs, resolvers } = require('./graphql');

dotenv.config();

const PORT = process.env.PORT;
const DB_HOST = process.env.DB_HOST;

const start = async () => {
  const app = express();
  const client = await MongoClient.connect(DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const githubToken = req.headers.authorization;
      const currentUser = await db.collection('users').findOne({ githubToken });

      return { db, currentUser };
    },
  });

  server.applyMiddleware({ app });

  app.set('trust proxy', 1);

  app.use(hpp());
  app.use(helmet());
  app.use(
    cors({
      origin: true,
    })
  );
  app.use(morgan('dev'));

  app.get('/', (req, res) => res.end('Welcome to the PhotoShare API by T2'));

  app.listen({ port: PORT }, () =>
    console.log(`GraphQL Server running @ http://localhost:${PORT}`)
  );
};

start();
