import React, { useState, useEffect } from 'react';
import { IoMdHeartEmpty } from "react-icons/io";
import { FaRegComment } from "react-icons/fa6";
import { AiOutlineRetweet } from "react-icons/ai";
import { FaRegUser, FaCheck, FaTrash, FaCheckDouble, FaTrashAlt } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useNotifications } from '../hooks/useNotifications'; // Re-adding this import
import { useNotificationPreferences } from '../hooks/useUserActions';
import { useNavigate } from 'react-router-dom';
import { SpinnerShimmer } from './LoadingShimmer';

const typeIcon = {
  like: <IoMdHeartEmpty className="text-red-500" size="20px" />,
  comment: <FaRegComment className="text-blue-600" size="18px" />,
  repost: <AiOutlineRetweet className="text-green-500" size="20px" />,
  mention: <FaRegUser className="text-blue-600" size="18px" />,
  follow: <FaRegUser className="text-green-500" size="18px" />,
};

const NOTI_TYPES = [
  { key: 'like', label: 'Likes' },
  { key: 'comment', label: 'Comments' },
  { key: 'follow', label: 'Follows' },
  { key: 'mention', label: 'Mentions' },
  { key: 'repost', label: 'Reposts' },
];

const NotificationPreferencesDrawer = ({ open, onClose }) => {
  const { preferences, isLoading, isError, error, updatePreferences, isUpdating, updateError } = useNotificationPreferences();
  const [currentPrefs, setCurrentPrefs] = useState(preferences); // Initialize with preferences if available
  const [saveSuccess, setSaveSuccess] = useState('');

  // Update currentPrefs when preferences from hook change (e.g., initial load or after save)
  useEffect(() => {
    if (preferences) {
      setCurrentPrefs(preferences);
    }
  }, [preferences]);

  // Handle radio change
  const handleChange = (type, value) => {
    if (!currentPrefs) return;
    if (type === 'all') {
      setCurrentPrefs(p => ({ ...p, all: { from: value } }));
    } else {
      setCurrentPrefs(p => ({
        ...p,
        types: {
          ...p.types,
          [type]: { from: value },
        },
      }));
    }
  };

  // Save preferences
  const handleSave = async () => {
    if (!currentPrefs) return;
    updatePreferences(currentPrefs, {
      onSuccess: () => {
        setSaveSuccess('Preferences saved!');
        setTimeout(() => {
          setSaveSuccess('');
          onClose();
        }, 800);
      },
      onError: () => {
        // Error is already handled by the hook's updateError
      }
    });
  };

  return (
    <div
      className={`fixed top-0 right-0 w-full h-full z-50 flex justify-end ${open ? '' : 'pointer-events-none'}`}
    >
      <div
        className={`bg-blue-200/90  w-full h-full transition-transform duration-500 ease-in-out rounded-l-2xl ${open? '':'translate-x-full'}`}
       
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-100/50 to-blue-400/50 rounded-tl-2xl border-b border-white border-opacity-30">
          <div className="text-base font-bold text-gray-800">Notification Preferences</div>
          <button className="text-3xl text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        </div>
        {/* Body */}
        <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}> {/* 60px is approx header height */}
          {isLoading ? (
            <div className="text-center text-blue-600 py-6 text-sm min-h-[100px] flex items-center justify-center">Loading...</div>
          ) : isError ? (
            <div className="text-center text-blue-800 py-3 text-sm min-h-[100px] flex items-center justify-center">{error?.message || 'Failed to load preferences'}</div>
          ) : currentPrefs ? (
            <>
              {/* Master switch */}
              <div className="mb-4 p-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow flex flex-col gap-1">
                <div className="font-semibold text-blue-800 text-sm">All Notifications</div>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="all"
                      value="anyone"
                      checked={currentPrefs.all.from === 'anyone'}
                      onChange={() => handleChange('all', 'anyone')}
                      className="accent-blue-500"
                    />
                    <span>Anyone</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="all"
                      value="no one"
                      checked={currentPrefs.all.from === 'no one'}
                      onChange={() => handleChange('all', 'no one')}
                      className="accent-blue-500"
                    />
                    <span>No one</span>
                  </label>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Turn all notifications on or off.</div>
              </div>
              {/* Per-type */}
              <div className="flex flex-col gap-2">
                {NOTI_TYPES.map(({ key, label }) => (
                  <div key={key} className="p-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow flex items-center gap-2">
                    <div className="font-medium text-gray-800 text-sm w-24 flex-shrink-0">{label}</div>
                    <div className="flex gap-2 ml-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name={key}
                          value="anyone"
                          checked={currentPrefs.types[key]?.from === 'anyone'}
                          onChange={() => handleChange(key, 'anyone')}
                          className="accent-blue-500"
                          disabled={currentPrefs.all.from === 'no one'}
                        />
                        <span>Anyone</span>
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name={key}
                          value="no one"
                          checked={currentPrefs.types[key]?.from === 'no one'}
                          onChange={() => handleChange(key, 'no one')}
                          className="accent-blue-500"
                          disabled={currentPrefs.all.from === 'no one'}
                        />
                        <span>No one</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {/* Save button */}
              <div className="mt-5 flex flex-col items-center gap-1">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-1.5 rounded-full shadow transition disabled:opacity-60 text-sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Preferences'}
                </button>
                {saveSuccess && <div className="text-green-600 text-xs mt-1">{saveSuccess}</div>}
                {updateError && <div className="text-red-600 text-xs mt-1">{updateError.message || 'Save failed'}</div>}
              </div>
            </>
          ) : null}
        </div>
      </div>
      {/* Click outside to close */}
      {open && <div className="flex-1" onClick={onClose}></div>}
    </div>
  );
};

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const {
    notifications,
    pagination,
    unreadCount,
    notificationsLoading,
    markAllAsRead,
    markAsRead,
    deleteAll,
    deleteOne,
    refetchNotifications,
    refetchUnread,
  } = useNotifications(page);
  const navigate = useNavigate();

  // Refetch notifications when the component mounts or when the activeTab changes
  useEffect(() => {
    refetchNotifications();
    refetchUnread();
  }, [refetchNotifications, refetchUnread]);

 

  // Filter notifications by type for tabs
  const filterNotifications = (type) => {
    if (type === 'all') return notifications;
    return notifications.filter(notif => notif.type === type);
  };

  // Format time (simple, you can use timeAgo util if available)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.post && notification.post._id) {
      navigate(`/home/post/${notification.post._id}`);
    } else if (notification.type === "follow" && notification.sender?.username) {
      navigate(`/home/profile/${notification.sender.username}`);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-1 overflow-hidden">
      <div className="sticky top-0  backdrop-blur-3xl bg-gradient-to-br from-zinc-200 to-blue-300 rounded-3xl shadow-lg p-2 ">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-1 ml-2">Unread: {unreadCount}</span>
            <button
              className="p-2 rounded-full hover:bg-blue-200 transition"
              title="Notification Settings"
              onClick={() => setPreferencesOpen(true)}
            >
              <IoSettingsSharp size={14} />
            </button>
          </div>
        </div>
        <div className="flex border-b border-white border-opacity-30">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-semibold text-gray-800 ${activeTab === 'all' ? 'border-b-2 border-blue-500' : 'hover:bg-white hover:bg-opacity-30 transition duration-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('mention')}
            className={`flex-1 py-2 text-sm font-semibold text-gray-800 ${activeTab === 'mention' ? 'border-b-2 border-blue-500' : 'hover:bg-white hover:bg-opacity-30 transition duration-200'}`}
          >
            Mentions
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={markAllAsRead}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded flex items-center gap-1"
          >
            <FaCheckDouble size={14} /> Mark all as read
          </button>
          <button
            onClick={deleteAll}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded flex items-center gap-1"
          >
            <FaTrashAlt size={14} /> Delete all
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="flex flex-col">
        {notificationsLoading ? (
          <div className="flex justify-center py-8"><SpinnerShimmer/></div>
        ) : filterNotifications(activeTab).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notifications</div>
        ) : (
          filterNotifications(activeTab).map((notification, index) => (
            <div key={notification._id || index} className={`flex items-center gap-1 p-2 hover:bg-white hover:bg-opacity-30 transition duration-200 cursor-pointer border-b border-zinc-500 border-opacity-30 last:border-b-0 ${!notification.read ? 'bg-blue-50 bg-opacity-40' : ''}`} onClick={() => handleNotificationClick(notification)}>
              <div className="w-8 flex-shrink-0">{typeIcon[notification.type] || <FaRegUser className="text-gray-400" size="18px" />}</div>
              <div className="w-10 h-10 flex-shrink-0">
                <img src={notification.sender?.avatar || notification.user?.avatar || require('../defaultavator.png')} alt={notification.sender?.username || notification.user?.username || 'user'} className="rounded-full w-8 h-8 object-cover border-2 border-white shadow-sm" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-gray-800">{notification.sender?.username || notification.user?.username || 'User'}</span>{' '}
                <span className="text-sm text-gray-700">{notification.message || notification.content}</span>
                <div className="text-xs text-gray-500">{formatTime(notification.createdAt)}</div>
              </div>
              <div className="flex flex-col gap-1 ml-2">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification._id);
                    }}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <FaCheck size={12} /> Mark as read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOne(notification._id);
                  }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded flex items-center justify-center gap-1 min-h-[28px]"
                >
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50 flex items-center gap-1"
            aria-label="Previous page"
          >
            <IoIosArrowBack size={14} />
          </button>
          <span className="px-2 py-1 text-xs">Page {pagination.currentPage} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50 flex items-center gap-1"
            aria-label="Next page"
          >
            <IoIosArrowForward size={14} />
          </button>
        </div>
      )}
      <NotificationPreferencesDrawer open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </div>
  );
};
