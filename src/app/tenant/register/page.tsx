"use client";

import { Suspense } from "react";
import TenantRegisterContent from "./TenantRegisterContent";

export default function TenantRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-600">Validating invitation...</p>
        </div>
      </div>
    }>
      <TenantRegisterContent />
    </Suspense>
  );
}