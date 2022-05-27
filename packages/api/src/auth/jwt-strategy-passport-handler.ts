// import passport from 'passport';
// import passportJwt from 'passport-jwt';

// const {
//   IUser,
//   CredentialModel,
// } = require('@devstarlight/replit-models');

// import config from '../config';

// const JwtStrategy = passportJwt.Strategy;
// const ExtractJwt = passportJwt.ExtractJwt;

// passport.use(new JwtStrategy({
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: config.jwt.secret
// }, function (jwtToken, done) {
//   CredentialModel.findOne({ username: jwtToken.username }, function (err: Error, user: typeof IUser) {
//     if (err) { return done(err, false); }

//     if (user) {
//       return done(undefined, user, jwtToken);
//     }

//     return done(undefined, false);
//   });
// }));