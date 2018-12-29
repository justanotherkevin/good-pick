// resolver must mirrow the schema
const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');
// if no logic is need, you can pull directly from prisma and run that function.
const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if user.id exist ( from express.middleware )
    if (!ctx.request.userId) {
      // not logedd in
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
  },
  async users(parent, args, ctx, info) {
    // 1. check if user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in');
    }
    // 2. check for permissions

    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);
    // 3. get users
    return ctx.db.query.users({}, info);
  }
};

module.exports = Query;
