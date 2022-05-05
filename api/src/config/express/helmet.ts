import helmet from 'helmet';

function initHelmet(app: any) {
    app.use(helmet());
    console.log('[server] Loaded helmet middleware');
}

module.exports = initHelmet;
