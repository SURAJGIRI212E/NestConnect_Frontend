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
    <div className="flex gap-1 px-2 py-1 cursor-pointer border-b border-[rgb(239,243,244)] hover:bg-gray-100">
      {/* Avatar Section */}
     

      <div className="w-[30px] overflow-clip items-start mt-1">
        <img className="rounded-full w-14 object-cover" src={useravator} alt="profile"
        />
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-xs font-bold">
              Indian Tech & Infra{" "}
              <img className="inline w-[14px] h-[14px]" src={badge} alt="verified" />
            </h1>
            <p className="text-gray-500 text-xs">@IndianTechGuide .</p>
            <span className="text-gray-500 text-xs">2h</span>
          </div>

          <div>
            <button className="rounded-full p-1 text-lg hover:text-blue-950 hover:bg-blue-100">
              <RiMoreLine />
            </button>
          </div>
        </div>

        {/* Main Tweet Section */}
        <div className="mt-[-5px]">
          <p className="text-left text-xs">
            Switzerland-based company TIL, proposing to invest Rs 20,000 crore
            for constructing the Vadhvan Port Project in Maharashtra.
          </p>
        </div>

        {/* Tweet Actions Section */}
        <div className="flex justify-between items-center text-gray-600">
          <div className="flex items-center rounded-full p-2 hover:bg-blue-100 hover:text-blue-600">
            <FaRegComment size="12px" />
            <p className="text-xs">10</p>
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-green-100 hover:text-green-600">
            <AiOutlineRetweet size="12px" />
            <p className="text-xs">10</p>
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-red-100 hover:text-red-600">
            <IoMdHeartEmpty size="13px" />
            <p className="text-xs">10</p>
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-blue-100 hover:text-blue-600">
            {isBookmarked ? (
              <IoBookmarkSharp size="14px" className="text-blue-600" />
            ) : (
              <IoBookmarkOutline size="14px" />
            )}
          </div>
          <div className="flex items-center rounded-full p-2 hover:bg-blue-100 hover:text-blue-600">
            <IoShareOutline />
          </div>
        </div>
      </div>
    </div>
  );
};
