


import { NextFunction, Request, Response } from 'express';
import { checkOtpRestrictions, handleForgotPassword, sendOtp, trackOtpRequests, validateRegistrationData, verifyForgotPasswordOtp, verifyOtp } from '../utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { UnauthorizedError, ValidationError,} from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';



//Register a new user
export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        validateRegistrationData(req.body, "user");
        const { name, email } = req.body;
        const existingUser = await prisma.users.findUnique({ where:{ email} });
        if (existingUser) {
            return next( new ValidationError("User already exists with this email!"));
        }
        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);
        await sendOtp(name, email, 'user-activation-email');
        res.status(200).json({
            message: "OTP sent to your email. Please verify to complete registration.",
            status: "success"
        });
    } catch (error) {
        return next(error);
    }
}

//Verify OTP for user registration
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp, password, name } = req.body;
        if (!email || !otp || !password || !name) {
            return next(new ValidationError("Missing required fields!"));
        }
        const existingUser = await prisma.users.findUnique({ where:{ email} });
        if (existingUser) {
            return next( new ValidationError("User already exists with this email!"));
        }
        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
            }
        });
        res.status(201).json({
            message: "User registered successfully!",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            },
            status: "success"
        });

    } catch (error) {
        return next(error);
    }
}

// login user
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ValidationError("Email and password are required!"));
        }
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return next(new UnauthorizedError("User not found!"));
        }
        //todo : if user is registered through social login, password will be null
        // In that case, we should not allow login with password
        // Instead, we should redirect to social login flow
        if (!user.password) {
            return next(new UnauthorizedError("Invalid password! Please use social login to access your account."));
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new UnauthorizedError("Invalid password!"));
        }
        //todo : generate JWT token here and send it in response
        const accessToken = jwt.sign({id: user.id,role:"user", email: user.email}, process.env.ACCESS_TOKEN_SECRET as string, {
            expiresIn: '15m'
        });
         const refreshToken = jwt.sign({id: user.id,role:"user", email: user.email}, process.env.REFRESH_TOKEN_SECRET as string, {
            expiresIn: '7d'
         });
        //store the refresh and access token in HTTP-only secure cookies
        //todo: I think better to pass a exp time to setCookie, to set separate durations.
        setCookie(res, "refresh_token", refreshToken);
        setCookie(res, "access_token", accessToken);
        res.status(200).json({
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            status: "success"
        });
    } catch (error) {
        return next(error);
    }
}

// refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return new ValidationError("Unauthorized! No refresh token.")
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as { id: string, role: string };
        if (!decoded || !decoded.id || !decoded.role) {
            return new JsonWebTokenError("Forbidden! Invalid refresh token.");
        }
        let account;
        if (decoded.role === "user") {
            account = await prisma.users.findUnique({ where: { id: decoded.id } });
            
        }

        if (!account) {
            return new UnauthorizedError("Forbidden! User/Seller not found")
        }
        const accessToken = jwt.sign({id: account.id,role:"user", email: account.email}, process.env.ACCESS_TOKEN_SECRET as string, {
            expiresIn: '15m'
        });
        setCookie(res, "access_token", accessToken);
        return res.status(200).json({success:true})
    } catch (error) {
        return next(error);
    }
}

//get logged in user
export const getUser = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        res.status(200).json({
            success: true,
            user,
        })
    } catch (error) {
        return next(error)
    }
}

// user Forgot password
export const userForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    await handleForgotPassword(req, res, next, "user")
}

//verify forgot password OTP
export const verifyUserForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    await verifyForgotPasswordOtp(req, res, next);
}

// Reset user password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, newPassword } = req.body;
        if(!email || !newPassword) return next(new ValidationError("Email and password are required!"))
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) return next(new ValidationError("User Not found!")); //todo : better to create a custom error other than ValidationError for this.

        // compare new password with existing one
        const isSamePassword = await bcrypt.compare(newPassword,user.password!)
        if (isSamePassword) {
            return next(new ValidationError("New password cannot be same as the old password"));
        }
        //hash the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({ where: { email }, data: { password: newHashedPassword } });
        res.status(200).json({message:"password reset successfully done."})
    } catch (error) {
        next(error)
    }
}