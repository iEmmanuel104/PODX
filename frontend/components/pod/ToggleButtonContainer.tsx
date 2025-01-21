import { MutableRefObject, useState } from 'react';
import clsx from 'clsx';
import ExpandLess from '../icons/ExpandLess';
import ExpandMore from '../icons/ExpandMore';
import Settings from '../icons/Settings';
import useClickOutside from '../../hooks/useClickOutside';

interface ToggleButtonContainerProps {
    children: React.ReactNode;
    deviceSelectors: React.ReactNode;
    icons?: React.ReactNode;
}

const ToggleButtonContainer = ({
    children,
    deviceSelectors,
    icons,
}: ToggleButtonContainerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const buttonRef = useClickOutside(() => {
        setIsOpen(false);
    }, true) as MutableRefObject<HTMLDivElement>;

    const toggleMenu = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <div className="relative flex items-center">
            <div className="flex items-center h-10 bg-[#2D2D2D] rounded-full">
                {children}
                <div
                    ref={buttonRef}
                    onClick={toggleMenu}
                    title="Device settings"
                    className="hidden h-full w-6 sm:flex items-center justify-center cursor-pointer hover:bg-[#3D3D3D] rounded-r-full transition-colors"
                >
                    <div className="h-6 w-6 flex justify-center items-center">
                        {isOpen ? (
                            <ExpandMore width={18} height={18} className="text-blue-400" />
                        ) : (
                            <ExpandLess width={18} height={18} className="text-white" />
                        )}
                    </div>
                </div>
            </div>

            {/* Device Selector Dropdown */}
            <div
                className={clsx(
                    'absolute left-0 bottom-full mb-2',
                    'min-w-[300px] bg-[#2D2D2D] rounded-lg shadow-lg',
                    'transform transition-all duration-200 ease-in-out',
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                )}
            >
                <div className="p-4 space-y-4">
                    {/* Device Selectors */}
                    <div className="space-y-2">{deviceSelectors}</div>

                    {/* Bottom Icons */}
                    {(icons || true) && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3D3D3D]">
                            {icons}
                            <div
                                title="Settings"
                                className="p-2 rounded-full hover:bg-[#3D3D3D] cursor-pointer transition-colors"
                            >
                                <Settings width={20} height={20} className="text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToggleButtonContainer;
