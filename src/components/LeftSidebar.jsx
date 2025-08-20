import logo from '../../src/logo.png'
import { GoHome } from "react-icons/go";
import { MdOutlineExplore } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";

import { MdOutlineLocalPostOffice } from "react-icons/md";
import { FaRegBookmark } from "react-icons/fa";
import { MdOutlineWorkspacePremium } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { TbPencilPlus } from "react-icons/tb";
import { IoMdLogOut } from "react-icons/io";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import { selectTotalUnreadCount } from '../redux/slices/chatSlice';
import { useNotifications } from '../hooks/useNotifications';
import { CreatePost } from '../minicomponents/CreatePost';
import { useState } from 'react';
import { IoClose } from "react-icons/io5";


export const LeftSidebar = () => {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const { user: currentUser ,logout } = useAuth();
  const totalUnreadCount = useSelector(selectTotalUnreadCount);
  const {  unreadCount}=useNotifications()

  const location = useLocation();

  const navItems = [
    { icon: <GoHome size="23px" className="text-gray-800" />, label: 'Home' ,path:'/home'},
    { icon: <MdOutlineExplore size="23px" className="text-gray-800" />, label: 'Explore', path:'/home/search' },
    { icon: <IoMdNotificationsOutline size="23px" className="text-gray-800" />, 
      label: 'Notification',path:'/home/noti',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { 
      icon: <MdOutlineLocalPostOffice size="23px" className="text-gray-800" />, 
      label: 'Message' ,path:'/home/message',
      badge: totalUnreadCount > 0 ? totalUnreadCount : null
    },
    { icon: <FaRegBookmark size="21px" className="text-gray-800" />, label: 'Bookmarks' ,path:'/home/bookmarks'},
    { icon: <MdOutlineWorkspacePremium size="23px" className="text-gray-800" />, label: 'Premium',path:'/premium' },
    { icon: <FaRegUser size="22px" className="text-gray-800" />, label: 'Profile' ,path:`/home/profile/${currentUser?.username}`},
 
 
];

  const handleLogout = async () => {
    await logout();
  };
    
  const handleOpenCreatePostModal = () => {
    setIsCreatePostModalOpen(true);
  };

  const handleCloseCreatePostModal = () => {
    setIsCreatePostModalOpen(false);
  };

  return (
    <>
        <div  className='mt-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 overflow-auto '>

        <div>
          <img className='w-10' src={logo} alt="logo" />
        </div> 
          {navItems.map((item, index) => (
            <Link to={item.path} key={index}
              className={`flex items-center gap-x-3 my-3 px-4 py-2 w-min transition-all duration-300 hover:bg-white hover:bg-opacity-80 hover:shadow-2xl rounded-full cursor-pointer relative ${location.pathname === item.path ? 'bg-white bg-opacity-80 shadow-2xl' : ''}`}
            >
              <div>{item.icon}</div>
              <h1 className="hidden lg:block font-semibold text-gray-800">{item.label}</h1>
              {item.badge && (
                <span className="absolute inline-flex items-center justify-center w-4 h-4 text-[10px]  text-white bg-blue-600  rounded-full top-1 end-1 ">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button 
            onClick={handleOpenCreatePostModal}
            className='w-4/6 flex justify-center items-center border-none text-sm text-white bg-blue-600 my-1 py-2 rounded-full cursor-pointer hover:bg-blue-700 transition duration-200 font-semibold'>
          <TbPencilPlus size='1rem' className='block lg:hidden '/><span className='hidden lg:block'>Post</span></button>
        
      
      <button 
  onClick={handleLogout}
  className='w-4/6 flex justify-center items-center border-none text-sm text-white my-2 py-2 bg-red-600 rounded-full cursor-pointer hover:bg-red-500 transition duration-200 font-semibold'
>
  <IoMdLogOut size='1rem' />
</button>

    </div>
    {isCreatePostModalOpen && (
        <div className=" fixed inset-0 bg-blue-300 backdrop-blur-sm bg-opacity-10 shadow-lg  flex items-center justify-center z-50">
          <div className="relative w-min-80 w-80">
            <button
              onClick={handleCloseCreatePostModal}
              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 text-xs flex items-center justify-center"
            >
              <IoClose size="16px" />
            </button>
            <CreatePost onClose={handleCloseCreatePostModal} />
          </div>
        </div>
      )}
    </>
  )
}
