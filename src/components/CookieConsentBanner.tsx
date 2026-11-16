"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Info,
  X,
  Checkmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "checkestate_cookie_consent";
const COOKIE_PREFERENCES_KEY = "checkestate_cookie_preferences";

type ConsentCategory = "essential" | "analytics" | "marketing";

interface CookieConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookieConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
};

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookieConsentState>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    const storedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (stored === "true") {
      setShowBanner(false);
      if (storedPrefs) {
        try {
          setPreferences(JSON.parse(storedPrefs));
        } catch {
          // use defaults
        }
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted: CookieConsentState = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setShowBanner(false);
  };

  const acceptEssential = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setShowBanner(false);
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  const updatePreference = (category: ConsentCategory, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [category]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setOpenPreferences(false);
    setShowBanner(false);
  };

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 text-white p-4 md:p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">We use cookies</h3>
                <p className="text-xs text-slate-300 mt-1">
                  We use cookies to improve your experience, analyze site traffic, and personalize content.{" "}
                  <a href="/privacy" className="text-blue-400 hover:underline text-sm">
                    Learn more
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 text-sm px-4 py-2"
                onClick={acceptEssential}
              >
                Essential Only
              </button>
              <Button
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-600 text-sm px-4 py-2"
                onClick={openPreferences}
              >
                Customize
              </button>
              <Button
                onClick={acceptAll}
                className="text-sm px-4 py-2"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreferences(false)} />
          <div className="relative w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Cookie Preferences</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Customize your cookie preferences below. Necessary cookies are required for the site to function properly.
            </p>
            <div className="space-y-4">
              {[
                {
                  id: "essential",
                  title: "Essential Cookies",
                  description:
                    "These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.",
                  required: true,
                },
                {
                  id: "analytics",
                  title: "Analytics Cookies",
                  description:
                    "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.",
                  required: false,
                },
                {
                  id: "marketing",
                  title: "Marketing Cookies",
                  description:
                    "These cookies are used to track visitors across websites to display relevant and engaging ads.",
                  required: false,
                },
              ].map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={preferences[item.id] || item.required}
                        disabled={item.required}
                        onChange={() => updatePreference(item.id, !preferences[item.id])}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <label htmlFor={item.id} className="text-sm font-medium text-slate-900 cursor-pointer cursor-default">
                        {item.title}
                        {item.required && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Required</span>}
                      </label>
                    </div>
                    {item.required ? null : (
                      <button
                        onClick={() => updatePreference(item.id, !preferences[item.id])}
                        className={`h-4 w-4 rounded border border-slate-300 ${
                          preferences[item.id] ? "bg-blue-600 text-white" : "text-slate-600"
                        }`}
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                </div>
              ))}
              <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button onClick={savePreferences} className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}