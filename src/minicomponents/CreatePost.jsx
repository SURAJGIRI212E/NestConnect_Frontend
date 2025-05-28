import React from 'react';
import avator from '../avator2.jpg';
import { GoFileMedia } from "react-icons/go";

export const CreatePost = () => {
  return (
    <div className="border-b border-[rgb(239, 243, 244)]  ">
   
     

      {/* Content */}
      <div>
        <div className="flex p-2">
          <div className="w-[32px] overflow-clip items-start mt-1">
            <img
              className="rounded-full w-10 object-cover"
              src={avator}
              alt="profile"
            />
          </div>
          <div className="w-full">
            <div>
              <textarea
                className="w-[100%] p-2 resize-none h-10 text-neutral-600 text-sm no-scrollbar focus:outline-none focus:border-b focus:h-[50px]"
                placeholder="What is happening?!"
              />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <label htmlFor="media-input" className="cursor-pointer text-xs">
                  <GoFileMedia />
                </label>
                <input
                  id="media-input"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>

              <button className="w-[50px] h-[25px] border-none text-[10px] text-white bg-[#171a1c] rounded-full cursor-pointer hover:bg-[#24272a]">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
