import CloseCircle from "@/public/icons/CloseCircle";
import TickCircle from "@/public/icons/TickCircle";
import { FC, useState } from "react";

interface TokingGatingSwitchProps {
    switchState: boolean;
    onClick: () => void;
}

const TokingGatingSwitch: FC<TokingGatingSwitchProps> = ({onClick, switchState}) => {
    return (
       <button className="flex bg-[#2B2B2B] p-[2px] rounded-3xl" onClick={onClick}>
       <div className="flex items-center gap-[8px]">
       <span className={`${!switchState ? 'bg-[#3c3c3c] w-[20px] h-[20px] rounded-full flex items-center justify-center' : 'p-[4px]' } `}>
            <div className="w-[12px] h-[12px] rounded-full">
                <CloseCircle color={`${!switchState ? "stroke-[#ADADAD]" : "stroke-[#515151]"}`}/>
            </div>
        </span>
       <span className={`${switchState ? 'bg-gradient-to-t from-[#6A42E2] to-[#D7B260]' : ''}  w-[20px] h-[20px] rounded-full flex items-center justify-center`}>
            <div className="w-[12px] h-[12px] rounded-full">
               <TickCircle color={`${switchState ? "stroke-white" : "stroke-[#515151]"}`}/>
            </div>
        </span>
       
       </div>
       </button>
    );
};

export default TokingGatingSwitch;
