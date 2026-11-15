"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      validateToken(t);
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

  const validateToken = async (t: string) => {
    try {
      const res = await fetch(`/api/auth/reset-password/validate?token=${t}`);
      const json = await res.json();
      if (res.ok && json.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast.error(json.error || "Invalid or expired reset token");
      }
    } catch {
      setTokenValid(false);
      toast.error("Failed to validate token");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      toast.success("Password reset successful");
      router.push("/auth/login");
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-600">Validating token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <span className="mx-auto h-12 w-12 text-red-500">⚠</span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Invalid Reset Link</h2>
          <p className="mt-2 text-slate-600">This password reset link is invalid or has expired.</p>
          <p className="mt-4 text-sm text-slate-500">Please request a new password reset link.</p>
          <Link href="/auth/forgot-password" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your new password below.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">🔒</span>
                  <input
                    id="password"
                    {...register("password")}
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">🔒</span>
                  <input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="mr-3 h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}