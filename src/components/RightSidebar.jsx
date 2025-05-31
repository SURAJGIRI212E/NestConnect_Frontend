import React from 'react'
import { IoIosSearch } from "react-icons/io";
import { WhoToFollow } from '../minicomponents/Whotofollow';

export const RightSidebar = () => {
  return (
    <div className='w-full '>
      <div className="sticky top-0 p-2 md:p-4">
        <div className=" flex items-center py-2 px-2 bg-gray-100 rounded-full border border-transparent 
        focus-within:border-blue-500 focus-within:bg-inherit focus-within:text-blue-500">
          <IoIosSearch size="18px"/>
          <input type="search" placeholder="search" className="mx-2 bg-inherit text-black w-full focus:outline-none" />
        </div>
      </div>
      
      <div className="px-2 md:px-4">
        <WhoToFollow/>
       <WhoToFollow/>
        
      </div>
    </div>
  )
}