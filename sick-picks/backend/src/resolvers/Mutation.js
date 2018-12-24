const Mutations = {
  async createItem(parent, args, ctx, info) {
    // check if user logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );
    return item;
  },

  updateItem(parent, args, ctx, info) {
    // take a copy of updates
    const updates = { ...args };
    // remove the ID from args
    delete updates.id;
    // call prisma mutation function 
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      // for client side return?
      info
    );
  }
};

module.exports = Mutations;
