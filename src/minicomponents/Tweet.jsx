import useravator from "../avator2.jpg";
import badge from "../Badge.png";
import { RiMoreLine } from "react-icons/ri";
// import { MiniProfileCard } from "./MiniProfileCard";
import { IoMdHeartEmpty } from "react-icons/io";
import { FaRegComment } from "react-icons/fa6";
import { IoBookmarkOutline, IoBookmarkSharp } from "react-icons/io5";
import { AiOutlineRetweet } from "react-icons/ai";
import { IoShareOutline } from "react-icons/io5";


export const Tweet = ({isBookmarked}) => {
 
  return (
    <div className="flex gap-1 px-4 py-3 cursor-pointer border-b border-white border-opacity-30 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg m-4 hover:bg-opacity-30 transition duration-200">
      {/* Avatar Section */}
     

      <div className="w-[30px] overflow-clip items-start mt-1">
        <img className="rounded-full w-14 object-cover" src={useravator} alt="profile"
        />
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-xs font-bold text-gray-800">
              Indian Tech & Infra{" "}
              <img className="inline w-[14px] h-[14px]" src={badge} alt="verified" />
            </h1>
            <p className="text-gray-600 text-xs">@IndianTechGuide .</p>
            <span className="text-gray-600 text-xs">2h</span>
          </div>

          <div>
            <button className="rounded-full p-1 text-lg text-gray-700 hover:text-blue-600 hover:bg-white hover:bg-opacity-30 transition duration-200">
              <RiMoreLine />
            </button>
          </div>
        </div>

        {/* Main Tweet Section */}
        <div className="mt-[-5px]">
          <p className="text-left text-sm text-gray-700">
            Switzerland-based company TIL, proposing to invest Rs 20,000 crore
            for constructing the Vadhvan Port Project in Maharashtra.
          </p>
        </div>

        {/* Tweet Actions Section */}
        <div className="flex justify-between items-center text-gray-600 mt-2">
          <div className="flex items-center rounded-full p-2 hover:bg-blue-200 hover:text-blue-600 transition duration-200">
            <FaRegComment size="14px" />
            <p className="text-xs">10</p>
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-green-100 hover:text-green-600 transition duration-200">
            <AiOutlineRetweet size="14px" />
            <p className="text-xs">10</p>
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-red-100 hover:text-red-600 transition duration-200">
            <IoMdHeartEmpty size="14px" />
            <p className="text-xs">10</p>
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-yellow-100 hover:text-yellow-600 transition duration-200">
            {isBookmarked ? (
              <IoBookmarkSharp size="14px" className="text-blue-600" />
            ) : (
              <IoBookmarkOutline size="14px" />
            )}
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-orange-100 hover:text-orange-600 transition duration-200">
            <IoShareOutline />
          </div>
        </div>
      </div>
    </div>
  );
};
