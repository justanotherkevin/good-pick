// resolver must mirrow the schema
const { forwardTo } = require('prisma-binding');
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
  }
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
