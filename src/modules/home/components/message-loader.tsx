"use client";
import Image from "next/image";
import { RunActionButton } from "@/components/ui/run-action-button";
import { FaInbox } from "react-icons/fa6";
import { RiBubbleChartFill } from "react-icons/ri";
import { BsFileTextFill, BsSendFill, BsTagFill } from "react-icons/bs";
import { TbClockHour12Filled } from "react-icons/tb";

const GENERATION_STEPS = [
  { id: 1, label: "Importing Data", icon: FaInbox },
  { id: 2, label: "Understanding Prompt", icon: RiBubbleChartFill },
  { id: 3, label: "Structuring UI", icon: BsTagFill },
  { id: 4, label: "Analyzing Layout", icon: TbClockHour12Filled },
  { id: 5, label: "Generating Components", icon: BsFileTextFill },
  { id: 6, label: "Finalizing Output", icon: BsSendFill },
];

const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-3">
        <Image src={"/logo.svg"} alt="BuildUI" width={28} height={28} className="shrink-0 invert dark:invert-0" />
      </div>
      <div className="pl-4">
        <RunActionButton steps={GENERATION_STEPS} />
      </div>
    </div>
  );
};

export default MessageLoading;
