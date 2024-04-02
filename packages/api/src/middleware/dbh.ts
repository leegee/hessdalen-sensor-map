// middleware/dbh.ts
import { Context, Next } from 'koa';
import { pool } from '../lib/dbh';

export async function dbhMiddleware(ctx: Context, next: Next) {
    ctx.dbh = pool;
    await next();
}

