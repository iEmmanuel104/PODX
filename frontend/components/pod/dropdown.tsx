import { MutableRefObject, ReactNode, useState } from 'react';
import clsx from 'clsx';

import ArrowDropdown from '../icons/ArrowDropdown';
import useClickOutside from '../../hooks/useClickOutside';

interface DropdownProps {
    icon?: ReactNode;
    label: string;
    value?: string;
    onChange?: (value: string) => void;
    options: {
        label: string;
        value: string;
        onClick?: () => void;
    }[];
    disabled?: boolean;
    className?: string;
    dark?: boolean;
}
const Dropdown = ({
    label,
    icon = null,
    onChange = () => null,
    options,
    value,
    disabled = false,
    className,
    dark = false,
}: DropdownProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const domNode = useClickOutside(() => {
        setDropdownOpen(false);
    }) as MutableRefObject<HTMLDivElement>;

    return (
        <div ref={domNode} className="relative">
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    'bg-[#2D2D2D] hover:bg-[#3D3D3D] transition-colors',
                    'text-sm text-white truncate w-full',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
                disabled={disabled}
            >
                {icon && <span className="text-white">{icon}</span>}
                <span className="truncate flex-1 text-left">{label}</span>
                <ArrowDropdown
                    className={clsx('transition-transform', dropdownOpen && 'rotate-180')}
                />
            </button>

            {dropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-full bg-[#2D2D2D] rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="max-h-48 overflow-y-auto py-1">
                        {options?.map(option => (
                            <div
                                key={option.value}
                                className={clsx(
                                    'px-3 py-2 cursor-pointer text-sm',
                                    'hover:bg-[#3D3D3D] transition-colors',
                                    value === option.value ? 'text-blue-400' : 'text-white'
                                )}
                                onClick={() => {
                                    onChange(option.value);
                                    setDropdownOpen(false);
                                }}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
