import badge from "../Badge.png";
export default function PremiumBadge() {
  return (
 
  
     <img class='inline-block h-3' src={badge} alt="" />
   
  );
}
export  function LargePremiumBadge() {
  return (
 
  
     <img class='inline-block h-8' src={badge} alt="" />
   
  );
}
// const badge=<img className="inline w-[10px] h-[10px]" src={badge} alt="verified" />