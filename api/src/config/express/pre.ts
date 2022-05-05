import corsMiddleware from './cors';
import helmetMiddleware from './helmet';
import bodyParserMiddleware from './body-parser';

module.exports = (app: any) => {
    corsMiddleware(app);
    helmetMiddleware(app);
    bodyParserMiddleware(app);
};
