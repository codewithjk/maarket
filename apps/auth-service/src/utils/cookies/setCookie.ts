import { Response, } from 'express';

export const setCookie = (res:Response, name:string, token:string) => {
    res.cookie(name, token, {
        httpOnly: true,
        secure: true,
        sameSite : "lax",
        // secure: process.env.NODE_ENV === 'production', // Set to true in production
        //sameSite should be set strict in production and none in development
        // sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day in milliseconds
    });
}