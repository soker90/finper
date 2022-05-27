// import passport from 'passport';
// import { NextFunction, Request, Response } from 'express';

// import '../auth/passport-handler';

// export class AuthController {
//   public authenticateJWT(req: Request, res: Response, next: NextFunction) {
//     passport.authenticate('jwt', function (err, user) {
//       if (err) {
//         return res.status(401).json({ status: 'error', code: 'unauthorized' });
//       }

//       if (!user) {
//         return res.status(401).json({ status: 'error', code: 'unauthorized' });
//       }

//       return next();
//     })(req, res, next);
//   }

//   public authorizeJWT(req: Request, res: Response, next: NextFunction) {
//     passport.authenticate('jwt', function (err, user, jwtToken) {
//       if (err) {
//         return res.status(401).json({ status: 'error', code: 'unauthorized' });
//       }

//       if (!user) {
//         return res.status(401).json({ status: 'error', code: 'unauthorized' });
//       }

//       const scope = req.baseUrl.split('/').slice(-1)[0];
//       const authScope = jwtToken.scope;

//       if (authScope && authScope.indexOf(scope) > -1) {
//         return next();
//       }

//       return res.status(401).json({ status: 'error', code: 'unauthorized' });
//     })(req, res, next);
//   }
// }
