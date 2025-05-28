import logo from '../../src/logo.png'
import { GoHome } from "react-icons/go";
import { MdOutlineExplore } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";

import { MdOutlineLocalPostOffice } from "react-icons/md";
import { FaRegBookmark } from "react-icons/fa";
import { MdOutlineWorkspacePremium } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import { selectTotalUnreadCount } from '../redux/slices/chatSlice';

export const LeftSidebar = () => {
  const { logout } = useAuth();
  const totalUnreadCount = useSelector(selectTotalUnreadCount);

  const navItems = [
    { icon: <GoHome size="23px" />, label: 'Home' ,path:'/home'},
    { icon: <MdOutlineExplore size="23px" />, label: 'Explore', path:'/home/search' },
    { icon: <IoMdNotificationsOutline size="23px" />, label: 'Notification',path:'/home/noti' },
    { 
      icon: <MdOutlineLocalPostOffice size="23px" />, 
      label: 'Message' ,path:'/home/message',
      badge: totalUnreadCount > 0 ? totalUnreadCount : null
    },
    { icon: <FaRegBookmark size="23px" />, label: 'Bookmarks' ,path:'/home/bookmarks'},
    { icon: <MdOutlineWorkspacePremium size="23px" />, label: 'Premium',path:'/premium' },
    { icon: <FaRegUser size="23px" />, label: 'Profile' ,path:'/home/profile'},
 
 
];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div  className='border-[rgb(239, 243, 244)] w-full sticky top-0'>
      <div>
        <div>
          <img className='w-10' src={logo} alt="logo" />
        </div>

        <div>
          {navItems.map((item, index) => (
            <Link to={item.path} key={index}
              className="flex gap-2 items-center my-1 pr-4 pl-1 py-2 w-min transition-all duration-300 hover:bg-gray-100 rounded-full cursor-pointer relative"
            >
              <div>{item.icon}</div>
              <h1 className="font">{item.label}</h1>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button className='w-4/5 text-center border-none text-sm text-white my-2 py-2 bg-[#171a1c] rounded-full cursor-pointer hover:bg-[#24272a]'>Post</button>
        </div>
      </div>
      <button 
        onClick={handleLogout}
        className='w-4/5 text-center border-none text-sm text-white my-2 py-1 bg-red-600 rounded-full cursor-pointer hover:bg-red-800'
      >
        Logout
      </button>
    </div>
  )
}
