const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

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
  },

  async deleteItem(parent, args, ctx, info) {
    // 1. find item
    // 2. check if user can delete item
    // 3. delete item
    const where = { id: args.id };
    const tempInfo = `{ id title}`;
    const item = await ctx.db.query.item({ where }, tempInfo);
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
    return { message: 'Thanks!' };
    // 3. Email them that reset token
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Yo Passwords don't match!");
    }
    // 2. check if its a legit reset token
    // 3. Check if its expired
    const [user] = await ctx.db.query.users({
      // return the first of the res array using users search
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
  }
};

module.exports = Mutations;
