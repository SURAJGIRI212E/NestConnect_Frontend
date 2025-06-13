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
      content: 'commented on your post: "Great insight!" Stanton said.',
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
    <div className="flex flex-col w-[90%] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 p-2 m-4">
      <div className="sticky top-0  backdrop-blur-3xl bg-gradient-to-br from-zinc-200 to-blue-300 rounded-3xl shadow-lg p-2 ">
        <h1 className="text-xl font-bold mb-4 text-gray-900">Notifications</h1>
        
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
      </div>

      <div className="flex flex-col">
        {filterNotifications(activeTab).map((notification, index) => (
          <div key={index} className="flex items-center gap-1 p-2 hover:bg-white hover:bg-opacity-30 transition duration-200 cursor-pointer border-b border-zinc-500 border-opacity-30 last:border-b-0">
            <div className="w-8 flex-shrink-0">{notification.icon}</div>
            <div className="w-10 h-10 flex-shrink-0">
              <img src={notification.avatar} alt={notification.user} className="rounded-full w-8 h-8 object-cover border-2 border-white shadow-sm" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-gray-800">{notification.user}</span>{' '}
              <span className="text-sm text-gray-700">{notification.content}</span>
              <div className="text-xs text-gray-500">{notification.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
