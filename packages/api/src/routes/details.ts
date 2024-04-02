/**
 * Until the MUFON Kaggle and Norege UFO databases are merged, their hard-coded names
 * (from config.db.database) control some SQL.
 */
import { Context } from 'koa';

import { FetchSightingDetailsResponse } from '@hessdalen-sensor-map/common-types/src';
import config from '@hessdalen-sensor-map/config/src';
import { CustomError } from '../middleware/errors';

export async function details(ctx: Context) {
    const body: FetchSightingDetailsResponse = {
        msg: '',
        status: 200,
        details: {},
    };

    const id = ctx.params.id.trim().replace(/\D+/, '');

    if (!id) {
        throw new CustomError({
            action: 'details',
            msg: 'Missing request parameter',
            details: ['id']
        })
    }

    try {
        // let sql = 'SELECT * FROM sightings WHERE id=$1';
        let sql = config.db.database === 'ufo' ?
            `SELECT * FROM sightings WHERE id=$1`
            : `SELECT sightings.*,
        observed_via.*, 
        yes_no_dontknow.*, 
        sky_condition.*, 
        sun_position.*, 
        fylke.*,
        report_status.*
        FROM sightings
        LEFT JOIN report_status ON sightings.report_status = report_status.id
        LEFT JOIN observed_via ON sightings.observed_via_id = observed_via.id
        LEFT JOIN yes_no_dontknow ON sightings.physical_effects = yes_no_dontknow.id
        LEFT JOIN sky_condition ON sightings.sky_condition_id = sky_condition.id
        LEFT JOIN sun_position ON sightings.sun_position_id = sun_position.id
        LEFT JOIN fylke ON sightings.Fylke = fylke.id
        WHERE sightings.id=$1`;

        const { rows } = await ctx.dbh.query(sql, [id]);

        body.details = rows[0];
    }
    catch (e) {
        throw new CustomError({
            action: 'details',
            details: { id },
            error: e as Error
        });
    }

    ctx.body = JSON.stringify(body);
}

