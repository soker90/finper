import bodyParser from 'body-parser';

function initBodyParser(app: any) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    console.log('[server] Loaded bodyParser middleware');
}

module.exports = initBodyParser;
