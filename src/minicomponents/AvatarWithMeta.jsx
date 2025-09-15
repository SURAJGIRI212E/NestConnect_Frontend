import React from 'react';
import { Link } from 'react-router-dom';
import PremiumBadge from './PremiumBadge';

const sizeMap = {
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

export default function AvatarWithMeta({
  avatar,
  name,
  username,
  time,
  to,
  size = 'md',
  showMeta = true,
  showPremium = false
}) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const textClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  const content = (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-6 h-6 ${sizeClass} overflow-hidden rounded-full flex-shrink-0`}> 
        <img src={avatar} alt="profile" className="w-full h-full object-cover" />
      </div>

      {showMeta && (
        <div className="flex items-center gap-1 min-w-0">
          <h1 className={`${textClass} font-bold text-gray-800 truncate whitespace-nowrap max-w-[4rem] sm:max-w-[7rem] md:max-w-[10rem]`}>{name}</h1>
          {showPremium && <PremiumBadge />}
          <p className={`${textClass} text-gray-700 truncate whitespace-nowrap max-w-[4rem] sm:max-w-[6.5rem] md:max-w-[8.5rem]`}>@{username}</p>
          {time && <span className={`${textClass} text-gray-700`}>{time}</span>}
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} onClick={(e) => e.stopPropagation()} className="block">{content}</Link>;
  }

  return content;
}
