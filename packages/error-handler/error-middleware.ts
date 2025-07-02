import { NextFunction, Request, Response } from "express";
import { AppError } from ".";

export const errorMiddleware = (err :Error, req : Request, res :Response, next :NextFunction) => {
    if (err instanceof AppError) {
        console.log(`Error: ${req.method}, ${req.url}, StatusCode: ${err.statusCode}, Message: ${err.message}`);
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(err.details && { details : err.details}),
        });
    }
    console.error(`🚫🚫🚫 UnHandled Error: ${req.method}, ${req.url}, Message: ${err.message}`);
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        details: err.message,
    }); 
}