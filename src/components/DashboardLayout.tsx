"use client";

import { useState, usePathname } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building,
  Home,
  List,
  FileText,
  DollarSign,
  Users,
  Building2,
  Briefcase,
  Bell,
  Settings,
  Mail,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/properties", icon: Building },
  { name: "Units", href: "/dashboard/units", icon: Home },
  { name: "Maintenance Requests", href: "/dashboard/maintenance-requests", icon: List },
  { name: "Work Orders", href: "/dashboard/work-orders", icon: FileText },
  { name: "Contractors", href: "/dashboard/contractors", icon: Briefcase },
  { name: "Expenses", href: "/dashboard/expenses", icon: DollarSign },
  { name: "Reports", href: "/dashboard/reports", icon: Mail },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Navigation Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full md:hidden transition-transform duration-300">
        <div className="flex h-full flex-col bg-white border-r border-slate-200">
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-slate-900 tracking-tight">CheckEstate</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-500 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <p className="text-xs text-blue-600 truncate">{user?.role}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="w-full py-2 px-4 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white md:flex flex-col">
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-slate-900 tracking-tight">CheckEstate</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            });
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <p className="text-xs text-blue-600 truncate">{user?.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-slate-400 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.organizationName || "Organization"}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}