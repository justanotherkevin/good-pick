// resolver must mirrow the schema
const { forwardTo } = require('prisma-binding');
// if no logic is need, you can pull directly from prisma and run that function.
const Query = {
  items: forwardTo('db'),
  item: forwardTo('db')
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
