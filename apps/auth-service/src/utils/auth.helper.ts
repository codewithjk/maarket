import crypto from 'crypto';
import { ValidationError } from '@packages/error-handler';
import { NextFunction, Request ,Response} from 'express';
import  redis  from '@packages/libs/redis';
import { sendEmail } from './sendMail';
import prisma from '@packages/libs/prisma';



const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// Validate registration data for user or seller
export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
    const { name, email, password, phone_number, country } = data;

    if(!name || !email || !password || (userType === "seller" && (!phone_number || !country))) {
        throw new ValidationError("Missing required fields!")
    }
    if(!mailRegex.test(email)) {
        throw new ValidationError("Invalid email format!");
    }
}

export const checkOtpRestrictions = async(email: string, next: NextFunction) => {
    if (await redis.get(`ort_lock:${email}`)) {
        return next(new ValidationError("You have reached the maximum number of OTP requests. Please try again after 30 minutes."));
    }
    if(await redis.get(`otp_spam_lock:${email}`)) {
        return next(new ValidationError("Too many OTP requests. Please wait 1 hour before trying again."));
    }
    if( await redis.get(`otp_cooldown:${email}`)) {
        return next(new ValidationError("Please wait 1 minute before requesting a new OTP."));
    }
}
export const trackOtpRequests = async (email: string, next: NextFunction) => {
    const otpRequestKey = `otp_request_count:${email}`;
    const otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");;
    if(otpRequests >= 2) {
        await redis.set(`otp_spam_lock:${email}`, 'true', 'EX', 3600); // Lock for 1 hour
        return next(new ValidationError("Too many OTP requests. Please wait 1 hour before trying again."));
    }
    await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600); // Increment request count and set expiry for 30 minutes
}

export const sendOtp = async (name: string, email: string, template: string) => {
    //todo : add proper error handling here when I tested, when sendEmail sends and error, the controller send a success response that OTP sent successfully
    const otp = crypto.randomInt(1000, 9999).toString();
    await sendEmail(email, 'Verify Your Email', template, { name, otp });
    await redis.set(`otp:${email}`, otp, 'EX', 300); // Store OTP in Redis with 5 minutes expiry
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown for 1 minute
}

export const verifyOtp = async (email: string, otp: string, next: NextFunction) => {
    //todo : add try catch block
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp) {
        throw new ValidationError("OTP has expired or is invalid!")
    }
    const failedAttemptsKey = `otp_failed_attempts:${email}`;
    const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0");
    if (storedOtp !== otp) {
        if (failedAttempts >= 2) {
            await redis.set(`ort_lock:${email}`, 'true', 'EX', 1800); // Lock for 30 minutes
            await redis.del(`otp:${email}`,failedAttemptsKey); // Clear failed attempts after lock
            throw new ValidationError("You have reached the maximum number of OTP attempts. Please try again after 30 minutes.");
        }
        await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
        throw new ValidationError(`Invalid OTP! Please try again. ${2 - failedAttempts} attempts left`);
    }
    await redis.del(`otp:${email}`,failedAttemptsKey); // Clear OTP after successful verification
}

//todo : better to add type into a file
export const handleForgotPassword = async (req: Request, res: Response, next: NextFunction, userType: "user" | "seller") => {
    try {
        const { email } = req.body;
        if (!email) throw new ValidationError("Email is required!");
        //find user or seller in db
        const user = userType === "user" && await prisma.users.findUnique({where:{email}})
        if(!user) throw new ValidationError(`${userType} is not found!`)

        //check otp restriction
        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);

        //Generate OTP and send email
        await sendOtp(user.name, email, userType === "user" ? "forgot-password-user-mail" : "forgot-password-seller-mail");
        res.status(200).json({ message: "OTP is sent to email. Please verify your account." });
    } catch (error) {
         next(error)
    }
}

export const verifyForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) throw new ValidationError("email and otp is required!");
        await verifyOtp(email,otp,next)
        res.status(200).json({message:"OTP verified. You can now reset your password."})
    } catch (error) {
        next(error)
    }
}