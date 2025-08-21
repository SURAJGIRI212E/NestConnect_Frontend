import React from 'react'
import { IoIosSearch } from "react-icons/io";
import { WhoToFollow } from '../minicomponents/Whotofollow';

export const RightSidebar = () => {

  return (
    <div className='w-full h-screen flex flex-col'>
      <div className="sticky top-0 p-2 md:p-4">
        <div className=" flex items-center py-2 px-2 bg-white shadow-2xl rounded-full border border-transparent 
            focus-within:border-black/50 ">
          <IoIosSearch size="18px"/>
          <input type="search" placeholder="search" className="mx-2 bg-inherit text-black w-full focus:outline-none" />
        </div>
      </div>
      
      <div className="px-2 md:px-4 flex-1">
            <WhoToFollow/>
      </div>

      {/* Static policy footer - plain anchors so server serves static files in public/ */}
      <div className="px-3 py-1 bg-transparent text-zinc-600 text-[10px]">
        <div className="flex flex-wrap gap-1 justify-center">
          <a href="/privacy/" className="pr-1 border-r border-zinc-600 hover:underline">Privacy Policy</a>
          <a href="/terms-and-conditions/" className="pr-1 border-r border-zinc-600 hover:underline">Terms &amp; Conditions</a>
          <a href="/cancellation-and-refunds/" className="pr-1 border-r border-zinc-600 hover:underline">Cancellation &amp; Refunds</a>
          <a href="/shipping/" className="pr-1 border-r border-zinc-600 hover:underline">Shipping</a>
          <a href="/contact-us/" className="pr-1 border-r border-zinc-600 hover:underline">Contact Us</a>
        </div>
      </div>
    </div>
  )
}