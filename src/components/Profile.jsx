import React from "react";
import { Tweet } from "../minicomponents/Tweet";
import { IoIosArrowBack } from "react-icons/io";
const Profile = ({ myfeedRef }) => {
  return (
    <div className="flex flex-col w-full">
      <div ref={myfeedRef} className="flex-1 ">
        
        <div className="sticky top-0 z-[102] backdrop-blur-3xl bg-white/95">
          <button onClick={() => window.history.back()} className="p-4"><IoIosArrowBack size="20px" /></button>
          <span className="text-xl font-bold">Username </span><span className="text-gray-500 text-xs">18k posts</span>
        </div>
        {/* Cover and Profile Picture */}
        <div className="relative">
          <div className="h-48 bg-gray-200"></div>

          {/* Profile Picture Container */}
          <div className="px-4">
            <div className="flex items-end justify-between">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 mt-[-55px]"></div>
            </div>
          </div>
        </div>

        {/* Sticky Follow Button Container */}
        <div className="sticky top-14 z-[101] bg-white/95 flex justify-end px-4">
          {!true ? (
            <button className="text-xs px-2 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-100">
              Edit profile
            </button>
          ) : (
            <>
              <button className="text-xs px-4 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800">
                Follow
              </button>
              <button className="ml-2 text-xs px-2 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-100">
                •••
              </button>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-4">
          <div className="flex justify-between">
            <div>
              <h1 className="text-xl font-extrabold">User Name</h1>
              <p className="text-gray-500 text-sm">@username</p>
            </div>
          </div>

          <p className="mt-2 text-sm">
            Bio goes here. djejfjdjcjdc. Bio goes here. djejfjdjcjdc.Bio goes
            here. djejfjdjcjdc..
          </p>

          <div className="text-sm flex gap-4 mt-1 text-gray-500">
            <span>Location</span>
            <span>Joined January 2024</span>
          </div>

          <div className="flex gap-4 mt-1 text-sm">
            <span>
              <strong>123</strong>{" "}
              <span className="text-gray-500">Following</span>
            </span>
            <span>
              <strong>456</strong>{" "}
              <span className="text-gray-500">Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mt-1">
          <button className="flex-1 py-4 font-semibold border-b-4 border-blue-500">
            Posts
          </button>
          <button className="flex-1 py-4 text-gray-500 hover:bg-gray-100">
            Replies
          </button>
          <button className="flex-1 py-4 text-gray-500 hover:bg-gray-100">
            Likes
          </button>
          <button className="flex-1 py-4 text-gray-500 hover:bg-gray-100">
            Bookmarks
          </button>
        </div>

        {/* Posts Feed */}
        <div className="p-4">
          <Tweet />
          <Tweet />
          <Tweet />
          <Tweet />
          <Tweet />
          <Tweet />
        </div>
      </div>
    </div>
  );
};

export default Profile;
