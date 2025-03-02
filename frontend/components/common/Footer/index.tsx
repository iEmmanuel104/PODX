//components/common/Footer/index.tsx
import Telegram from '@/public/images/icons/socials/Telegram';
import X from '@/public/images/icons/socials/X';

const Footer = () => {
    return (
        <div className="w-full transition-all duration-200">
            <div className="flex justify-between items-center">
                <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text">
                        PodX
                    </span>
                    {' © '}
                    {new Date().getFullYear()}
                </span>

                <div className="flex gap-2 sm:gap-4">
                    <a
                        href="https://t.me/podx_fun"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Join us on Telegram"
                        className="h-5 w-5 sm:h-6 sm:w-6 opacity-75 hover:opacity-100 transition-all duration-200"
                    >
                        <Telegram />
                    </a>
                    <a
                        href="https://x.com/podx_fun"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Follow us on X"
                        className="h-5 w-5 sm:h-6 sm:w-6 opacity-75 hover:opacity-100 transition-all duration-200"
                    >
                        <X />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Footer;
