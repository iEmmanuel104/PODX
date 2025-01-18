import React, { useState, useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setFirstTimeUser, updateUser } from "@/store/slices/userSlice";
import UserInfoModal from "./userInfoModal";
import OnboardingStep from "./onboardingSteps";

interface UserOnboardingFlowProps {
    isOpen: boolean;
    onClose: () => void;
    initialUsername: string;
    onUpdate: (newUsername: string) => void;
    firstTimeUser: boolean;
}

const UserOnboardingFlow: React.FC<UserOnboardingFlowProps> = ({ isOpen, onClose, initialUsername, onUpdate, firstTimeUser }) => {
    const dispatch = useAppDispatch();
    const [showOnboarding, setShowOnboarding] = useState(firstTimeUser);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [activeStep, setActiveStep] = useState(1);

    const handleOnboardingComplete = useCallback(() => {
        setShowOnboarding(false);
        setShowUsernameModal(true);
        // Update firstTimeUser in Redux state
        dispatch(setFirstTimeUser(false));
        // Also update in updateUser to ensure consistency
        dispatch(updateUser({ firstTimeUser: false }));
    }, [dispatch]);

    const handleNextStep = useCallback(() => {
        if (activeStep === OnboardingStep.steps.length) {
            handleOnboardingComplete();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    }, [activeStep, handleOnboardingComplete]);

    const handleSkipOnboarding = useCallback(() => {
        handleOnboardingComplete();
    }, [handleOnboardingComplete]);

    const handleUsernameUpdate = useCallback(
        (newUsername: string) => {
            onUpdate(newUsername);
            // Ensure firstTimeUser is false when username is updated
            dispatch(setFirstTimeUser(false));
            dispatch(
                updateUser({
                    username: newUsername,
                    firstTimeUser: false,
                })
            );
            onClose();
        },
        [onUpdate, onClose, dispatch]
    );

    // Show username modal immediately for non-first-time users
    React.useEffect(() => {
        if (isOpen && !firstTimeUser) {
            setShowUsernameModal(true);
        }
    }, [isOpen, firstTimeUser]);

    const currentStep = OnboardingStep.steps[activeStep - 1];

    return (
        <>
            {showOnboarding && currentStep && (
                <OnboardingStep
                    title={currentStep.title}
                    description={currentStep.description}
                    img={currentStep.img}
                    activeStep={activeStep}
                    stepsLength={OnboardingStep.steps.length}
                    nextFunc={handleNextStep}
                    skipFunc={handleSkipOnboarding}
                    showOnboarding={showOnboarding}
                />
            )}

            {showUsernameModal && (
                <UserInfoModal
                    isOpen={true}
                    onClose={onClose}
                    initialUsername={initialUsername}
                    onUpdate={handleUsernameUpdate}
                    firstTimeUser={firstTimeUser}
                />
            )}
        </>
    );
};

export default UserOnboardingFlow;
