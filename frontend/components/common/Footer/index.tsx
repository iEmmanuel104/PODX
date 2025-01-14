import Telegram from "@/assets/icons/socials/Telegram";
import X from "@/assets/icons/socials/X";

const Footer = () => {
  return (
    <footer className="w-full bg-transparent py-[54px]">
      <div className="container mx-auto">
      <div className="w-full flex justify-between items-center">
              <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text font-medium text-sm">
                Podx @ {new Date().getFullYear()}
              </span>

              <div className="socials flex gap-[8px]">
                <a
                  href="https://t.me/podx_fun"
                  target="_blank"
                  className="social-icon h-[24px] w-[24px]"
                >
                  <Telegram />
                </a>
                {/* <a href="#!" target="_blank" className="social-icon h-[24px] w-[24px]">
              <Facebook />
            </a> */}
                <a
                  href="https://x.com/podx_fun"
                  target="_blank"
                  className="social-icon h-[24px] w-[24px]"
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
