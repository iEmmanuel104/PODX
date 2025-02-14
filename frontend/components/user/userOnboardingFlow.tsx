import React, { useReducer, useCallback, useState } from 'react';
import UserInfoModal from './userInfoModal';
import OnboardingStep from './onboardingSteps';
import { setFirstTimeUser, updateUser } from '@/store/auth/slice';
import { useAppDispatch } from '@/store/config/store';

interface UserOnboardingFlowProps {
    isOpen: boolean;
    onClose: () => void;
    initialUsername: string;
    onUpdate: (newUsername: string) => void;
    firstTimeUser: boolean;
}

interface FlowState {
    showOnboarding: boolean;
    showUsernameModal: boolean;
    activeStep: number;
    isTransitioning: boolean;
}

type FlowAction =
    | { type: 'NEXT_STEP' }
    | { type: 'COMPLETE_ONBOARDING' }
    | { type: 'SHOW_USERNAME_MODAL' }
    | { type: 'RESET' };

const initialState = (firstTimeUser: boolean): FlowState => ({
    showOnboarding: firstTimeUser,
    showUsernameModal: !firstTimeUser,
    activeStep: 1,
    isTransitioning: false,
});

function flowReducer(state: FlowState, action: FlowAction): FlowState {
    switch (action.type) {
        case 'NEXT_STEP':
            return {
                ...state,
                activeStep: state.activeStep + 1,
                isTransitioning: true,
            };
        case 'COMPLETE_ONBOARDING':
            return {
                ...state,
                showOnboarding: false,
                showUsernameModal: true,
                isTransitioning: false,
            };
        case 'SHOW_USERNAME_MODAL':
            return {
                ...state,
                showUsernameModal: true,
                isTransitioning: false,
            };
        case 'RESET':
            return {
                ...state,
                isTransitioning: false,
            };
        default:
            return state;
    }
}

const UserOnboardingFlow: React.FC<UserOnboardingFlowProps> = ({
    isOpen,
    onClose,
    initialUsername,
    onUpdate,
    firstTimeUser,
}) => {
    const dispatch = useAppDispatch();
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [state, dispatchFlow] = useReducer(flowReducer, firstTimeUser, initialState);

    const handleOnboardingComplete = useCallback(() => {
        dispatchFlow({ type: 'COMPLETE_ONBOARDING' });
        dispatch(setFirstTimeUser(false));
        dispatch(updateUser({ firstTimeUser: false }));
    }, [dispatch]);

    const handleNextStep = useCallback(() => {
        if (state.activeStep === OnboardingStep.steps.length) {
            handleOnboardingComplete();
        } else {
            setDirection('forward');
            dispatchFlow({ type: 'NEXT_STEP' });
        }
    }, [state.activeStep, handleOnboardingComplete]);

    const handleSkipOnboarding = useCallback(() => {
        handleOnboardingComplete();
    }, [handleOnboardingComplete]);

    const handleUsernameUpdate = useCallback(
        (newUsername: string) => {
            onUpdate(newUsername);
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

    React.useEffect(() => {
        if (isOpen && !firstTimeUser) {
            dispatchFlow({ type: 'SHOW_USERNAME_MODAL' });
        }
    }, [isOpen, firstTimeUser]);

    const currentStep = OnboardingStep.steps[state.activeStep - 1];

    return (
        <>
            {state.showOnboarding && currentStep && (
                <OnboardingStep
                    key={state.activeStep}
                    title={currentStep.title}
                    description={currentStep.description}
                    img={currentStep.img}
                    activeStep={state.activeStep}
                    stepsLength={OnboardingStep.steps.length}
                    nextFunc={handleNextStep}
                    skipFunc={handleSkipOnboarding}
                    showOnboarding={state.showOnboarding}
                    direction={direction}
                />
            )}

            {state.showUsernameModal && (
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
