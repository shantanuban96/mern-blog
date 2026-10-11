const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const config = require('./env');
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

// Same handler for both providers: turn the provider profile into one of our users
const handleProfile = (provider) => async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await authService.findOrCreateSocialUser({
      provider,
      providerId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value,
    });
    done(null, user);
  } catch (err) {
    logger.warn(`${provider} login failed:`, err.message);
    done(null, false); // Passport then redirects to the failure URL
  }
};

// Each provider is only enabled when its keys are in .env
function setupPassport() {
  if (config.google.clientID) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientID,
          clientSecret: config.google.clientSecret,
          callbackURL: `${config.serverUrl}/api/v1/auth/google/callback`,
        },
        handleProfile('google')
      )
    );
  }

  if (config.facebook.clientID) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: config.facebook.clientID,
          clientSecret: config.facebook.clientSecret,
          callbackURL: `${config.serverUrl}/api/v1/auth/facebook/callback`,
          profileFields: ['id', 'displayName', 'emails', 'photos'],
        },
        handleProfile('facebook')
      )
    );
  }
}

module.exports = setupPassport;
