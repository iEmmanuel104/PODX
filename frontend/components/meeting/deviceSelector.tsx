import React, { ReactNode } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Mic, Video, Volume2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DeviceSelectorProps = {
    devices: MediaDeviceInfo[] | undefined;
    selectedDeviceId?: string;
    onSelect: (deviceId: string) => void;
    icon: ReactNode;
    disabled?: boolean;
    className?: string;
};

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ devices, selectedDeviceId, onSelect, icon, disabled = false, className = "" }) => {
    const label = devices?.find((device) => device.deviceId === selectedDeviceId)?.label || "Default";

    return (
        <Select disabled={disabled} value={selectedDeviceId} onValueChange={onSelect}>
            <SelectTrigger className={cn("w-[200px] bg-[#2C2C2C] text-white", className)}>
                {icon}
                <SelectValue placeholder={disabled ? "Permission needed" : label} />
            </SelectTrigger>
            <SelectContent>
                {devices?.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export const AudioInputDeviceSelector: React.FC<{ disabled?: boolean; className?: string }> = ({ disabled = false, className = "" }) => {
    const { useMicrophoneState } = useCallStateHooks();
    const { microphone, devices, selectedDevice } = useMicrophoneState();

    return (
        <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDevice}
            onSelect={(deviceId) => microphone.select(deviceId)}
            icon={<Mic className="mr-2 h-4 w-4" />}
            disabled={disabled}
            className={className}
        />
    );
};

export const VideoInputDeviceSelector: React.FC<{ disabled?: boolean; className?: string }> = ({ disabled = false, className = "" }) => {
    const { useCameraState } = useCallStateHooks();
    const { camera, devices, selectedDevice } = useCameraState();

    return (
        <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDevice}
            onSelect={(deviceId) => camera.select(deviceId)}
            icon={<Video className="mr-2 h-4 w-4" />}
            disabled={disabled}
            className={className}
        />
    );
};

export const AudioOutputDeviceSelector: React.FC<{ disabled?: boolean; className?: string }> = ({ disabled = false, className = "" }) => {
    const { useSpeakerState } = useCallStateHooks();
    const { speaker, devices, selectedDevice, isDeviceSelectionSupported } = useSpeakerState();

    if (!isDeviceSelectionSupported) return null;

    return (
        <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDevice ? selectedDevice : devices ? devices[0]?.deviceId : undefined}
            onSelect={(deviceId) => speaker.select(deviceId)}
            icon={<Volume2 className="mr-2 h-4 w-4" />}
            disabled={disabled}
            className={className}
        />
    );
};
