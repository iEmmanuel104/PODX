import { useCallStateHooks } from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { AudioInputDeviceSelector, AudioOutputDeviceSelector } from './DeviceSelector';
import CallControlButton from './CallControlButton';
import MicFilled from '../icons/MicFilled';
import MicOffFilled from '../icons/MicOffFilled';
import ToggleButtonContainer from './ToggleButtonContainer';

const ICON_SIZE = 20;

const ToggleAudioButton = () => {
    const { useMicrophoneState } = useCallStateHooks();
    const {
        microphone,
        optimisticIsMute: isMicrophoneMute,
        hasBrowserPermission,
    } = useMicrophoneState();

    const toggleMicrophone = async () => {
        try {
            await microphone.toggle();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <ToggleButtonContainer
            deviceSelectors={
                <>
                    <AudioInputDeviceSelector
                        className="w-[12.375rem]"
                        dark
                        disabled={!hasBrowserPermission}
                    />
                    <AudioOutputDeviceSelector
                        className="w-[12.375rem]"
                        dark
                        disabled={!hasBrowserPermission}
                    />
                </>
            }
        >
            <CallControlButton
                icon={
                    isMicrophoneMute ? (
                        <MicOffFilled className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                        <MicFilled className="w-5 h-5 sm:w-6 sm:h-6" />
                    )
                }
                title={isMicrophoneMute ? 'Turn on microphone' : 'Turn off microphone'}
                onClick={toggleMicrophone}
                active={isMicrophoneMute}
                alert={!hasBrowserPermission}
                className={clsx(
                    'bg-[#2D2D2D] hover:bg-[#3D3D3D]',
                    isMicrophoneMute && 'bg-[#1D1D1D] text-red-500'
                )}
            />
        </ToggleButtonContainer>
    );
};

export default ToggleAudioButton;
