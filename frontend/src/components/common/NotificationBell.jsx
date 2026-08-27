/**
 * NotificationBell.jsx
 * Owned by: Module 5
 * Path matches Master Spec Section 9 exactly: components/common/NotificationBell.jsx
 *
 * Self-contained — fetches its own data via alertService, polls for updates,
 * and needs no props. Any module (including Module 6 dashboards / the shared
 * app header owned by Module 1) can drop <NotificationBell /> in directly.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import alertService from '../../services/alertService';

const POLL_INTERVAL_MS = 30000;

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await alertService.getAlerts();
      setNotifications(res.data?.notifications || []);
      setError(null);
    } catch (err) {
      setError('Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkAsRead(id) {
    try {
      await alertService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      // non-fatal — leave item as-is, user can retry
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">Notifications</span>
            {loading && <span className="text-xs text-gray-400">Refreshing…</span>}
          </div>

          {error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}

          {!error && notifications.length === 0 && !loading && (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</div>
          )}

          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`px-4 py-3 text-sm cursor-pointer ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}
                onClick={() => !n.isRead && handleMarkAsRead(n._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-gray-800">{n.title}</span>
                  {!n.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />}
                </div>
                <p className="text-gray-600 mt-0.5">{n.message}</p>
                <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
