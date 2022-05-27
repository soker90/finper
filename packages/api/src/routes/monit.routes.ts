import {Router} from 'express';

import {MonitController} from '../controllers/monit.controller';

import loggerHandler from '../utils/logger';
import passport from "passport";

export class MonitRoutes {
    router: Router;

    public monitController: MonitController = new MonitController({
        loggerHandler: loggerHandler('MonitController'),
    });

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.get('/health',
            passport.authenticate('local', {failureRedirect: '/login'}),
            this.monitController.getHealthStatus.bind(this.monitController));
    }
}
