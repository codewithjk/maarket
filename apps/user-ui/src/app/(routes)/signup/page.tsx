"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import GoogleSignInButton from "../../shared/components/google-button";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

type FormData = {
  name: string;
  email: string;
  password: string;
};

function Signup() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [showOtp, setShowOtp] = useState(false);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
    
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

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/user-registration`,
        data
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/verify-user`,
        {
          ...userData,
          otp: otp.join(""),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  const onSubmit = (data: FormData) => {
    signupMutation.mutate(data);
  };
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

    const handleResendOtp = () => {
        if (userData) {
            signupMutation.mutate(userData);
      }
  };

  return (
    <div>
      <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
        <h1 className="text-4xl font-Poppins font-semibold text-black text-center ">
          Signup
        </h1>
        <p className="text-center text-lg font-medium py-3 text-[#00000099]">
          Home . Signup
        </p>
        <div className="w-full flex justify-center">
          <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
            <h3 className="text-3xl font-semibold text-center md-2">
              Signup to Maarket
            </h3>
            <p className="text-center text-gray-500 mb-4">
              Already have an account?
              <Link href={"/login"} className="text-blue-500">
                Log in
              </Link>
            </p>
            <GoogleSignInButton />
            <div className="flex items-center my-5 text-gray-400 text-sm">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3">or sign up with email</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {!showOtp ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* name input */}
                <label htmlFor="user-name" className="block text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="user-name"
                  placeholder="jeevan kumar"
                  className=" w-full p-2 border border-black outline-0 !rounded mb-1"
                  {...register("name", {
                    required: "name is required",
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">
                    {String(errors.name.message)}
                  </p>
                )}
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

                {/* password input */}
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
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full text-lg cursor-pointer mt-4 bg-black text-white py-2 rounded-lg"
                >
                  {signupMutation.isPending ? "Signing up..." : "Signup"}
                </button>
                {signupMutation?.isError &&
                  signupMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-2">
                      {signupMutation.error.response?.data?.message ||
                        signupMutation.error.message}
                    </p>
                  )}
              </form>
            ) : (
              <div>
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
                {verifyOtpMutation?.isError &&
                  verifyOtpMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-2">
                      {verifyOtpMutation.error.response?.data?.message ||
                        verifyOtpMutation.error.message}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
