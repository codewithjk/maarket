"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { serve } from "swagger-ui-express";

type FormData = {
  email: string;
  password: string;
};

function ForgotPassword() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const router = useRouter();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 60) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/forgot-password-user`,
        {
          email,
        }
      );
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep("otp");
      setServerError(null);
      setCanResend(false);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP. Try again!";
      setServerError(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/verify-forgot-password-user`,
        {
          email: userEmail,
          otp: otp.join(""),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP. Try again!";
      setServerError(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!password) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/reset-password-user`,
        {
          email: userEmail,
          newPassword: password,
        }
      );
      return response.data;
    },

    onSuccess: () => {
      setStep("email");
      toast.success(
        "Password reset successfully! Please login with your new password."
      );
      setServerError(null);
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Failed to reset password. Try again!";
      setServerError(errorMessage);
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {};

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate({ email });
  };
  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };
  return (
    <div>
      <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
        <h1 className="text-4xl font-Poppins font-semibold text-black text-center ">
          Forgot Password
        </h1>
        <p className="text-center text-lg font-medium py-3 text-[#00000099]">
          Home . Forgot Password
        </p>
        <div className="w-full flex justify-center">
          <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
            {step === "email" && (
              <>

                <p className="text-center text-gray-500 mb-4">
                  Go back to?
                  <Link href={"/login"} className="text-blue-500">
                    Login
                  </Link>
                </p>

                <form onSubmit={handleSubmit(onSubmitEmail)}>
                  {/* email input */}
                  <label
                    htmlFor="user-email"
                    className="block text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="user-email"
                    placeholder="example@gmai.com"
                    className=" w-full p-2 border border-black outline-0 !rounded mb-1"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {String(errors.email.message)}
                    </p>
                  )}

                  <button
                    disabled={requestOtpMutation.isPending}
                    type="submit"
                    className="w-full text-lg cursor-pointer bg-black mt-4 text-white py-2 rounded-lg"
                  >
                    {requestOtpMutation.isPending ? "Sending OTP..." : "Submit"}
                  </button>
                  {serverError && (
                    <p className="text-red-500 text-sm mt-2"> {serverError}</p>
                  )}
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <h3 className="text-xl font-semibold text-center mb-4">
                  Enter OTP
                </h3>
                <div className="flex justify-center gap-6">
                  {otp?.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      id={"otp" + index}
                      ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                      }}
                      maxLength={1}
                      className="w-12 h-12 text-center border border-gray-300 outline-none !rounded"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>
                <button
                  disabled={verifyOtpMutation.isPending}
                  onClick={() => verifyOtpMutation.mutate()}
                  className=" w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                </button>
                <p className="text-center text-sm mt-4">
                  {canResend ? (
                    <button
                      onClick={handleResendOtp}
                      className=" text-blue-500 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2"> {serverError}</p>
                )}
              </>
            )}

            {step === "reset" && (
              <>
                <h3 className="text-xl font-semibold text-center mb-4">
                  Reset Password
                </h3>

                <form onSubmit={handleSubmit(onSubmitPassword)}>
                  <label
                    htmlFor="user-password"
                    className="block text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="user-password"
                      placeholder="min 6 characters "
                      className=" w-full p-2 border border-black outline-0 !rounded mb-1"
                      {...register("password", {
                        required: "password is required",
                        minLength: {
                          value: 6,
                          message: "password must be at least 6 characters",
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                    >
                      {passwordVisible ? <Eye /> : <EyeOff />}
                    </button>
                
                  </div>

                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {String(errors.password.message)}
                    </p>
                  )}

                  <button
                    disabled={resetPasswordMutation.isPending}
                    type="submit"
                    className="w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg"
                  >
                    {resetPasswordMutation.isPending
                      ? "Resetting..."
                      : "Reset Password"}
                                  </button>
                                  {
                                      serverError && (
                                          <p className=" text-red-500 text-sm mt-2">{ serverError}</p>
                                      )
                                  }
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
