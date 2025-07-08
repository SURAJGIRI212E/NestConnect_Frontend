import React, { useState, useEffect } from 'react';
import { IoMdHeartEmpty } from "react-icons/io";
import { FaRegComment } from "react-icons/fa6";
import { AiOutlineRetweet } from "react-icons/ai";
import { FaRegUser } from "react-icons/fa6";
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const typeIcon = {
  like: <IoMdHeartEmpty className="text-red-500" size="20px" />,
  comment: <FaRegComment className="text-blue-500" size="18px" />,
  repost: <AiOutlineRetweet className="text-green-500" size="20px" />,
  mention: <FaRegUser className="text-blue-500" size="18px" />,
  follow: <FaRegUser className="text-green-500" size="18px" />,
};

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
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
  }, [activeTab, refetchNotifications, refetchUnread]);

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
    <div className="flex flex-col w-[90%] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 p-2 m-4">
      <div className="sticky top-0  backdrop-blur-3xl bg-gradient-to-br from-zinc-200 to-blue-300 rounded-3xl shadow-lg p-2 ">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-1 ml-2">Unread: {unreadCount}</span>
        </div>
        <div className="flex border-b border-white border-opacity-30">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-semibold text-gray-800 ${activeTab === 'all' ? 'border-b-2 border-blue-500' : 'hover:bg-white hover:bg-opacity-30 transition duration-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('mention')}
            className={`flex-1 py-3 text-sm font-semibold text-gray-800 ${activeTab === 'mention' ? 'border-b-2 border-blue-500' : 'hover:bg-white hover:bg-opacity-30 transition duration-200'}`}
          >
            Mentions
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={markAllAsRead}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
          >
            Mark all as read
          </button>
          <button
            onClick={deleteAll}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
          >
            Delete all
          </button>
        </div>
      </div>

      <div className="flex flex-col min-h-[200px]">
        {notificationsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filterNotifications(activeTab).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notifications</div>
        ) : (
          filterNotifications(activeTab).map((notification, index) => (
            <div key={notification._id || index} className={`flex items-center gap-1 p-2 hover:bg-white hover:bg-opacity-30 transition duration-200 cursor-pointer border-b border-zinc-500 border-opacity-30 last:border-b-0 ${!notification.read ? 'bg-blue-50 bg-opacity-40' : ''}`} onClick={() => handleNotificationClick(notification)}>
              <div className="w-8 flex-shrink-0">{typeIcon[notification.type] || <FaRegUser className="text-gray-400" size="18px" />}</div>
              <div className="w-10 h-10 flex-shrink-0">
                <img src={notification.sender?.avatar || notification.user?.avatar || require('../avator2.jpg')} alt={notification.sender?.username || notification.user?.username || 'user'} className="rounded-full w-8 h-8 object-cover border-2 border-white shadow-sm" />
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
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOne(notification._id);
                  }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                >
                  Delete
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
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 py-1">Page {pagination.currentPage} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
