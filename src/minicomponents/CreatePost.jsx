import React from 'react';
import avator from '../avator2.jpg';
import { GoFileMedia } from "react-icons/go";

export const CreatePost = () => {
  return (
    <div className="border-b border-white border-opacity-30 p-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg m-4">
 
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
                className="w-[100%] p-2 resize-none h-10 text-gray-800 text-sm no-scrollbar focus:outline-none focus:border-b focus:h-[50px] bg-transparent placeholder-gray-600"
                placeholder="What is happening?!"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div>
                <label htmlFor="media-input" className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 transition duration-200">
                  <GoFileMedia />
                </label>
                <input
                  id="media-input"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>

              <button className="w-[60px] h-[30px] border-none text-xs text-white bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition duration-200 font-semibold">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
