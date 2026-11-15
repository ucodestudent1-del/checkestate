"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Search, ChevronDown, ChevronRight } from "lucide-react";

export default function ApiDocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);
  const [specUrl, setSpecUrl] = useState("/api/docs");

  useEffect(() => {
    if (swaggerRef.current && window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        url: specUrl,
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIBundle.presets.standalone],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
          // Add CSRF token if available
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
          if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            req.headers["x-csrf-token"] = csrfToken;
          }
          return req;
        },
      });
    }
  }, [specUrl]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Documentation</h1>
          <p className="text-slate-600 mt-1">Interactive API reference with OpenAPI 3.1 specification</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.open(specUrl, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View JSON
          </Button>
          <Button variant="outline" onClick={() => {
            const link = document.createElement("a");
            link.href = specUrl;
            link.download = "checkestate-api.json";
            link.click();
          }}>
            <Download className="mr-2 h-4 w-4" />
            Download Spec
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded block break-all">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}
            </code>
            <p className="mt-2 text-xs text-slate-500">All API requests are relative to this base URL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-slate-900">Session Cookie</span>
              <p className="text-slate-500">NextAuth.js session cookie (HttpOnly)</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-900">CSRF Token</span>
              <p className="text-slate-500">Required header: <code>x-csrf-token</code></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-slate-900">General API</span>
              <p className="text-slate-500">100 requests/minute</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-900">Auth Endpoints</span>
              <p className="text-slate-500">5 requests/15 minutes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-slate-900">Current Version</span>
              <p className="text-slate-500">v1.0.0</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-900">OpenAPI Spec</span>
              <p className="text-slate-500">3.1.0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="swagger-ui" ref={swaggerRef} className="h-[80vh] min-h-[600px] bg-white rounded-lg border border-slate-200" />
    </div>
  );
}

import { useState } from "react";