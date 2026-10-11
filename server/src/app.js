const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const config = require('./config/env');
const setupPassport = require('./config/passport');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

setupPassport();

const app = express();

app.set('trust proxy', 1); // correct client IP behind a proxy (needed for rate limiting)
app.use(helmet()); // security headers
app.use(cors({ origin: config.clientUrl, credentials: true })); // allow the React app + cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
