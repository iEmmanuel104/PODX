import IconButton, { IconButtonProps } from './iconButton';
import clsx from 'clsx';

interface CallControlButtonProps extends Omit<IconButtonProps, 'variant'> {}

const CallControlButton = ({
    active,
    alert,
    className,
    icon,
    onClick,
    title,
}: CallControlButtonProps) => {
    return (
        <IconButton
            variant="secondary"
            active={active}
            alert={alert}
            icon={icon}
            title={title}
            className={clsx(
                'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center',
                'bg-[#2D2D2D] hover:bg-[#3D3D3D] transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                active && 'bg-[#1D1D1D]',
                alert && 'bg-red-500 hover:bg-red-600',
                className
            )}
            onClick={onClick}
        />
    );
};

export default CallControlButton;
