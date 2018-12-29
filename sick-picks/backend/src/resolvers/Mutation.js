const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // check if user logged in
    // console.log(ctx);
    if (!ctx.request.userId) {
      throw new Error('you must be logged in to do that');
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // creating relationship, user and item
          user: {
            connect: { id: ctx.request.userId }
          },
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
  },

  async deleteItem(parent, args, ctx, info) {
    // 1. find item
    // 2. check if user can delete item
    // 3. delete item
    const where = { id: args.id };
    const tempInfo = `{ id title user{ id }}`;
    const item = await ctx.db.query.item({ where }, tempInfo);
    // if for delete permission
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(userPerm =>
      ['ADMIN', 'ITEMDELETE'].includes(userPerm)
    );
    console.log(ownsItem, hasPermissions);
    if (!ownsItem || !hasPermissions) {
      throw new Error(' no way jose ');
    }
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    // lowercase their email
    args.email = args.email.toLowerCase();
    // hash their password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      },
      info
    );
    // create the JWT token for them, app_secret is out handshake token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // We set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Finalllllly we return the user to the browser
    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    // check if user exist with email
    const user = await ctx.db.query.user({
      where: {
        email
      }
    });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // user founded, check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    }
    // user founded, password matched, generate jwt
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // user founded, password matched, generate jwt, set the cookie with token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // return user
    return user;
  },
  // signout for user
  signout(parent, args, ctx, info) {
    // clearCookie come from cookieParser (index.js)
    ctx.response.clearCookie('token');
    return { message: 'sign out' };
  },
  // get reset token for password reset
  async requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // 2. Set a reset token and expiry on that user
    const randomBytesPromiseified = promisify(randomBytes);
    const resetToken = (await randomBytesPromiseified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    // 3. Email them that reset token
    const mailRes = await transport.sendMail({
      from: 'noreply@sickpick.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeANiceEmail(`Your Password Reset Token is here!
      \n\n
      <a href="${
        process.env.FRONTEND_URL
      }/reset?resetToken=${resetToken}">Click Here to Reset</a>`)
    });
    return { message: 'Thanks!' };
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Yo Passwords don't match!");
    }
    // 2. check if its a legit reset token
    // 3. Check if its expired
    const [user] = await ctx.db.query.users({
      // return the first of the res array using users
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error('This token is either invalid or expired!');
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // 8. return the new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // check if logged in
    if (!ctx.request.userId) {
      throw new Error('you must be logged in !');
    }
    //  query the current user
    const currentUser = await ctx.db.query.user(
      { where: { id: ctx.request.userId } },
      info
    );
    // check if user have permission to change
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // update permission
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            // bc permission is now a enum Permission; do it this way
            set: args.permissions
          }
        },
        where: {
          // you might be updating another users' permission
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    const { userId } = ctx.request;
    // 1. check if user is logged in
    if (!ctx.request.userId) {
      throw new Error('you must be logged in !');
    }
    // 2. get user carts
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    // 3. if item already in cart
    if (existingCartItem) {
      // console.log('This item is already in their cart');
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        },
        info
      );
    }
    // 4. if item is not in cart
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId }
          },
          item: {
            connect: { id: args.id }
          }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. find cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id
        }
      },
      `{id, user{id}}`
    );
    if (!cartItem) {
      throw new Error('No cart item found');
    }
    // 2. make sure its owner
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('Not owner of cart item');
    }
    // 3. delete item
    // deleteCartItem(where: CartItemWhereUniqueInput!): CartItem
    return ctx.db.mutation.deleteCartItem({ where: { id: args.id } }, info);
  }
};

module.exports = Mutations;
