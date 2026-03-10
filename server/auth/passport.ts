import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as db from "../db";

// Configure Google OAuth strategy (only if credentials present)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const name = profile.displayName ?? null;
          const openId = `google_${profile.id}`;

          await db.upsertUser({
            openId,
            name,
            email,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });

          const user = await db.getUserByOpenId(openId);
          done(null, user ?? false);
        } catch (err) {
          done(err as Error, undefined);
        }
      }
    )
  );
}

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.openId ?? user.id);
});

// Deserialize user from session
passport.deserializeUser(async (identifier: string, done) => {
  try {
    const user = await db.getUserByOpenId(identifier);
    done(null, user ?? null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
