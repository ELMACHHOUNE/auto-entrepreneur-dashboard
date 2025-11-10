import passport from 'passport';
// Type-only import guarded for environments without @types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { cookieOpts } from '../middleware/auth';
import type { Request } from 'express';

const TOKEN_COOKIE = 'token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (
      req: Request,
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('No email from Google'));
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            googleId: profile.id,
            role: 'user',
            fullName: profile.displayName,
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        // Set JWT as cookie on the response
        const token = signToken({ sub: user.id, role: user.role, email: user.email });
        // @ts-ignore
        req.res?.cookie(TOKEN_COOKIE, token, cookieOpts(env.IS_PROD, MAX_AGE_MS));

        return done(null, user);
      } catch (e) {
        return done(e as any);
      }
    }
  )
);
