import express from 'express';
import http from 'http';

const app = express();

require('./config/db')();
require('./config/express/pre')(app);
// require('./api')(app);

const config = require('./config');

const port = process.env.PORT || config.port;

process.on('uncaughtException', err => {
    console.error('uncaughtException exception: ', err);
});

app.set('port', port);

const server = http.createServer(app);

function onError(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[onError] - There was an error starting the server', error);
    process.exit(1);
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? `pipe ${addr}`
        : `port ${addr?.port}`;

    // eslint-disable-next-line no-console
    console.log(`[onListening] - Server listening on ${bind}`);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
