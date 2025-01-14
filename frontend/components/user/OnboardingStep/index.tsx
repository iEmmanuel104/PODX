import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DotPattern } from "@/components/ui/dot-pattern";
import Image, { StaticImageData } from "next/image";
import { FC } from "react";
import { cn } from "@/lib/utils";

import styles from "../styles.module.scss";

interface OnboardingStepProps {
  title: string;
  description: string;
  img: StaticImageData;
  skipFunc: () => void;
  nextFunc: () => void;
  activeStep: number;
  stepsLength: number;
  showOnboarding: boolean;
}

const OnboardingStep: FC<OnboardingStepProps> = ({
  title,
  description,
  img,
  activeStep,
  nextFunc,
  skipFunc,
  stepsLength,
  showOnboarding,
}) => {
  return (
    <Dialog open={showOnboarding}>
      <DialogContent key={title} className={styles.dialogContent}>
        <DotPattern
          width={20}
          height={20}
          cx={2}
          cy={2}
          cr={1}
          className={cn(
            "[mask-image:radial-gradient(to_bottom_right,white,transparent,transparent)] rounded-[20px] top-[6px] left-[8px] px-[10px]"
          )}
        />
        <DialogTitle className="text-[8px] text-[#ddb958] font-medium">GET STARTED ON PODX</DialogTitle>
        <DialogHeader className="text-xl font-medium">
          {title}
        </DialogHeader>
        <div className="flex flex-col gap-[32px]">
          <div className="flex flex-col gap-[32px]">
            <p className="text-sm font-medium text-[#8c8c8c]">{description}</p>
            <div className="relative img-container max-w-[436px] h-[115px] rounded-lg">
              <Image
                src={img}
                alt={`${title} step image`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
                placeholder="blur"
                className="absolute rounded-lg w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="step-count text-sm font-medium text-[#8c8c8c] flex gap-[2px]">
              <span>{activeStep}</span>
              <span>of</span>
              <span>{stepsLength}</span>
            </div>
            <div className="flex gap-[16px]">
              <Button onClick={skipFunc} className="rounded-[10px] px-[16px] py-[12px] text-[#d4d4d4] font-medium bg-[#292929]">Skip</Button>
              <Button onClick={nextFunc} className="rounded-[10px] px-[16px] py-[12px] text-[#d4d4d4] font-medium bg-[#6032F6]">
                {activeStep === stepsLength ? "Finish" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingStep;
