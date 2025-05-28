import React, { useState } from 'react';
import { IoMdHeartEmpty } from "react-icons/io";
import { FaRegComment } from "react-icons/fa6";
import { AiOutlineRetweet } from "react-icons/ai";
import { FaRegUser } from "react-icons/fa6";
import useravator from "../avator2.jpg";

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');

  const notifications = [
    {
      type: 'like',
      user: 'John Doe',
      avatar: useravator,
      content: 'liked your post',
      time: '2h',
      icon: <IoMdHeartEmpty className="text-red-500" size="20px" />
    },
    {
      type: 'comment',
      user: 'Jane Smith',
      avatar: useravator, 
      content: 'commented on your post: "Great insight!"',
      time: '4h',
      icon: <FaRegComment className="text-blue-500" size="18px" />
    },
    {
      type: 'repost',
      user: 'Mike Johnson',
      avatar: useravator,
      content: 'reposted your post',
      time: '5h',
      icon: <AiOutlineRetweet className="text-green-500" size="20px" />
    },
    {
      type: 'mention',
      user: 'Sarah Wilson',
      avatar: useravator,
      content: 'mentioned you in a post',
      time: '6h',
      icon: <FaRegUser className="text-blue-500" size="18px" />
    }
  ];

  const filterNotifications = (type) => {
    if (type === 'all') return notifications;
    return notifications.filter(notif => notif.type === type);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-[102] backdrop-blur-3xl bg-white/95 p-4">
        <h1 className="text-xl font-bold mb-4">Notifications</h1>
        
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500' : ''}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('mention')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'mention' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Mentions
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {filterNotifications(activeTab).map((notification, index) => (
          <div key={index} className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b">
            <div className="w-8">{notification.icon}</div>
            <div className="w-10 h-10">
              <img src={notification.avatar} alt={notification.user} className="rounded-full w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <span className="font-bold">{notification.user}</span>{' '}
              <span className="text-xs text-gray-600">{notification.content}</span>
              <div className="text-xs text-gray-500">{notification.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
