// middleware/errors.ts - Error handling middleware
import Koa from 'koa';

export class CustomError {
    action: string;
    details: any;
    status?: number;
    msg?: string | string[];
    error?: Error | string;

    constructor(args: {
        action: string;
        details: any;
        status?: number;
        msg?: string | string[];
        error?: Error | string;
    }) {
        this.action = args.action;
        this.details = args.details;
        this.status = args.status || 500;
        if (args.msg) this.msg = args.msg;
        if (args.error) this.error = args.error;
    }
}

export async function errorHandler(ctx: Koa.Context, next: Koa.Next) {
    try {
        await next();

        if (!ctx.status) {
            ctx.status = 404;
        }
    }
    catch (error) {
        console.error(error);
        if (process.env.NODE_ENV === 'production') {
            error.error = '';
        }
        ctx.body = {
            ...error,
            error: error.error.toString()
        };
    }
}

