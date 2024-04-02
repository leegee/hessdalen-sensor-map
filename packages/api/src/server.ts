/*

GET /search

    lat_min
    lng_min
    lat_max
    lng_max
    to_date?
    from_date?

GET /detail/:id

  :id === sightings.id

*/

import Koa from "koa";
import Router from 'koa-router';
import cors from "@koa/cors";

import config from '@hessdalen-sensor-map/config/src';

import { search as searchRoute } from './routes/search';
import { details as detailsRoute } from './routes/details';
import { errorHandler } from "./middleware/errors";
import { dbhMiddleware } from './middleware/dbh';

if (!config.db.engine) {
    throw new TypeError('Env var UFO_DB_ENGINE needs to be postgres or mysql');
} else {
    console.debug(`config.db.engine=${config.db.engine}`);
}

const router = new Router();
const app = new Koa();

app.use(cors({ origin: "*" }));
app.use(errorHandler);
app.use(dbhMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

router.get('/search', searchRoute);
router.get('/details/:id', detailsRoute);

app.listen(config.api.port, () => {
    console.info({ 
        action: 'start-up', 
        port: config.api.port, 
        taking_to: config.db.database,
});
});

