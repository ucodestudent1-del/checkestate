"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Bell, Trash2, Edit3, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  channel: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/notifications?unreadOnly=${unreadOnly}`);
    const json = await res.json();
    setNotifications(json.data || []);
    setLoading(false);
  }, [unreadOnly]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600">Stay informed about maintenance activity</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setUnreadOnly(!unreadOnly)}>
          {unreadOnly ? "Show All" : "Unread Only"}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Title</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Message</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Channel</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Date</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Status</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!n.isRead ? "bg-blue-50" : ""}`}>
                  <td className="pb-3 pl-4 text-slate-900 font-medium">{n.title}</td>
                  <td className="pb-3 pl-4 text-slate-600">{n.message}</td>
                  <td className="pb-3 pl-4 text-slate-600">{n.channel}</td>
                  <td className="pb-3 pl-4 text-slate-600 text-xs">{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td className="pb-3 pl-4"><span className={`px-2 py-1 rounded text-xs font-medium ${n.isRead ? "bg-slate-100 text-slate-700" : "bg-blue-100 text-blue-700"}`}>{n.isRead ? "Read" : "Unread"}</span></td>
                  <td className="text-right pb-3 pr-4">
                    {!n.isRead && <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>Mark Read</Button>}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && <tr><td colSpan={6} className="pb-6 pt-6 text-center text-slate-500">No notifications found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
