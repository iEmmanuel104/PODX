import Telegram from '@/public/images/icons/socials/Telegram';
import X from '@/public/images/icons/socials/X';

const Footer = () => {
    return (
        <footer className="w-full bg-transparent py-8 relative z-10">
            <div className="container mx-auto px-4">
                <div className="w-full flex justify-between items-center">
                    <span className="font-medium text-sm">
                        <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text">
                            PodX
                        </span>
                        {' © '}
                        {new Date().getFullYear()}
                    </span>

                    <div className="flex gap-4">
                        <a
                            href="https://t.me/podx_fun"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Join us on Telegram"
                            className="h-6 w-6 opacity-75 hover:opacity-100 transition-opacity"
                        >
                            <Telegram />
                        </a>
                        <a
                            href="https://x.com/podx_fun"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Follow us on X"
                            className="h-6 w-6 opacity-75 hover:opacity-100 transition-opacity"
                        >
                            <X />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
