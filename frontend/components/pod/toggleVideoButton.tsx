import { useCallStateHooks } from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import CallControlButton from './callControlButton';
import ToggleButtonContainer from './toggleButtonContainer';
import Videocam from '../icons/Videocam';
import VideocamOff from '../icons/VideocamOff';
import VisualEffects from '../icons/VisualEffects';
import { VideoInputDeviceSelector } from './deviceSelector';

const ICON_SIZE = 20;

const ToggleVideoButton = () => {
    const { useCameraState } = useCallStateHooks();
    const { camera, optimisticIsMute: isCameraMute, hasBrowserPermission } = useCameraState();

    const toggleCamera = async () => {
        try {
            await camera.toggle();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <ToggleButtonContainer
            deviceSelectors={
                <VideoInputDeviceSelector
                    className="w-[23.125rem]"
                    dark
                    disabled={!hasBrowserPermission}
                />
            }
            // icons={
            //     <div title="Apply visual effects">
            //         <VisualEffects className="w-5 h-5 sm:w-6 sm:h-6" />
            //     </div>
            // }
        >
            <CallControlButton
                icon={
                    isCameraMute ? (
                        <VideocamOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                        <Videocam className="w-5 h-5 sm:w-6 sm:h-6" />
                    )
                }
                title={isCameraMute ? 'Turn on camera' : 'Turn off camera'}
                onClick={toggleCamera}
                active={isCameraMute}
                alert={!hasBrowserPermission}
                className={clsx(
                    'bg-[#2D2D2D] hover:bg-[#3D3D3D]',
                    isCameraMute && 'bg-[#1D1D1D] text-red-500'
                )}
            />
        </ToggleButtonContainer>
    );
};

export default ToggleVideoButton;
