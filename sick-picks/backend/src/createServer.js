const { GraphQLServer } = require('graphql-yoga');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const db = require('./db');

/**
 *? what is GraphQL Yoga
 * basically express / apollo-server
 * create an abstraction on top of Apollo’s Express-based version of their JavaScript GraphQL server library. (Basically Express)
**/
function createServer() {
  return new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    resolvers: {
      Mutation,
      Query
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    context: req => ({ ...req, db })
  });
}
module.exports = createServer;
