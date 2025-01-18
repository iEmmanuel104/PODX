import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DotPattern } from "@/components/ui/dot-pattern";
import Image, { StaticImageData } from "next/image";
import { FC } from "react";
import { cn } from "@/lib/utils";
import step1Image from "@/public/images/step1.png";
import step2Image from "@/public/images/step2.png";
import step3Image from "@/public/images/step3.png";
import step4Image from "@/public/images/step4.png";

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

const steps = [
    {
        id: 1,
        title: "Your onchain workspace",
        description: "A secure, decentralized hub for all your projects. Work smarter, together, onchain",
        img: step1Image,
    },
    {
        id: 2,
        title: "Host sessions",
        description: "Start a meeting or podcast session in seconds – collaborate, share, and record with ease",
        img: step2Image,
    },
    {
        id: 3,
        title: "Join sessions",
        description: "Start a meeting or podcast session in seconds – collaborate, share, and record with ease",
        img: step3Image,
    },
    {
        id: 4,
        title: "Tip and earn seamlessly",
        description: "Support great ideas and earn effortlessly with built-in tipping powered by onchain transactions",
        img: step4Image,
    },
] as const;

const OnboardingStep: FC<OnboardingStepProps> & { steps: typeof steps } = ({
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
            <DialogContent
                key={title}
                className="text-white rounded-[20px] p-[32px] w-full max-w-[500px] flex flex-col gap-[8px] bg-[#1d1d1d] overflow-hidden"
            >
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
                <DialogHeader className="text-xl font-medium transition-all duration-300">{title}</DialogHeader>
                <div className="flex flex-col gap-[32px]">
                    <div className="flex flex-col gap-[32px]">
                        <p className="text-sm font-medium text-[#8c8c8c] transition-all duration-300 ease-in-out">{description}</p>
                        <div className="relative img-container max-w-[436px] h-[115px] rounded-lg overflow-hidden">
                            <div className="transition-all duration-300 ease-in-out transform">
                                <Image
                                    src={img}
                                    alt={`${title} step image`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority
                                    placeholder="blur"
                                    className="absolute rounded-lg w-full h-full object-contain transition-opacity duration-300"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="step-count text-sm font-medium text-[#8c8c8c] flex gap-[2px]">
                            <span className="transition-all duration-300">{activeStep}</span>
                            <span>of</span>
                            <span>{stepsLength}</span>
                        </div>
                        <div className="flex gap-[16px]">
                            <Button
                                onClick={skipFunc}
                                className="rounded-[10px] px-[16px] py-[12px] text-[#d4d4d4] font-medium bg-[#292929] transition-colors"
                            >
                                Skip
                            </Button>
                            <Button
                                onClick={nextFunc}
                                className="rounded-[10px] px-[16px] py-[12px] text-[#d4d4d4] font-medium bg-[#6032F6] transition-colors"
                            >
                                {activeStep === stepsLength ? "Finish" : "Continue"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

OnboardingStep.steps = steps;

export default OnboardingStep;
