"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function TenantRegisterContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [invitationValid, setInvitationValid] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      validateToken(t);
    } else {
      setInvitationValid(false);
    }
  }, [searchParams]);

  const validateToken = async (t: string) => {
    try {
      const res = await fetch(`/api/tenant/invitations/validate?token=${t}`);
      const json = await res.json();
      if (res.ok && json.valid) {
        setInvitationValid(true);
      } else {
        setInvitationValid(false);
        toast.error(json.error || "Invalid or expired invitation");
      }
    } catch {
      setInvitationValid(false);
      toast.error("Failed to validate invitation");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/tenant/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully");
      router.push("/tenant/login");
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (invitationValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <span className="mx-auto h-12 w-12 text-red-500">⚠</span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Invalid Invitation</h2>
          <p className="mt-2 text-slate-600">This invitation link is invalid or has expired.</p>
          <p className="mt-4 text-sm text-slate-500">Please contact your property manager for a new invitation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Complete your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Set up your password to access the tenant portal
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">👤</span>
                    <input
                      id="firstName"
                      {...register("firstName")}
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">👤</span>
                    <input
                      id="lastName"
                      {...register("lastName")}
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">📧</span>
                  <input
                    id="email"
                    {...register("email")}
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="name@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
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
                    Confirm password
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="mr-3 h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}