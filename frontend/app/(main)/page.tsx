"use client";

import { useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppDispatch } from "@/store/hooks";
import { logOut } from "@/store/slices/userSlice";
import localFont from "next/font/local";
import Logo from "@/assets/icons/Logo";
import Telegram from "@/assets/icons/socials/Telegram";
// import Facebook from "@/assets/icons/socials/Facebook";
import X from "@/assets/icons/socials/X";

import styles from "./styles.module.scss";

const balige = localFont({
  src: "../fonts/Balige - Personal Use.otf",
  variable: "--font-balige",
});

export default function LandingPage() {
  const dispatch = useAppDispatch();
  const { login, logout, ready } = usePrivy();

  const handleConnect = useCallback(async () => {
    try {
      await logout(); // Log out of existing privy session
      dispatch(logOut()); // clear user data from store
      await login();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }, [logout, dispatch, login]);

  if (!ready) return null;

  return (
    <>
      <main className={`${styles.main} ${balige.variable}`}>
        <div className="container mx-auto">
          <div className={styles.contentWrapper}>
            <div className={styles.contents}>
              <div className={styles.logo}>
                <Logo />
              </div>
              <div className="flex flex-col gap-[68px]">
                <div className="flex flex-col justify-center items-center gap-[24px]">
                  <div className="flex justify-center items-center rounded-full bg-gradient-to-r from-[#552FC9]  to-[#D7B35D] p-[1px]">
                    <span className="rounded-full bg-black text-white text-xs uppercase tracking-wider py-[4px] px-[16px] ">
                      A creator's workspace
                    </span>
                  </div>
                  <h1 className="text-4xl lg:text-h1 text-center font-balige lg:leading-[45px] text-light-gray">
                    Host meetings, record sessions, earn proof of attendance,
                    and{" "}
                    <span className="inline-block">
                      <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text">
                        tip
                      </span>
                    </span>{" "}
                    seamlessly
                  </h1>
                </div>

                <div className="flex justify-center">
                  <button
                    className="py-2 px-8 rounded-[10px] bg-[#6032F6] hover:bg-[#4C28C4] transition-colors text-white font-medium text-lg"
                    onClick={handleConnect}
                  >
                    Get started
                  </button>
                </div>
              </div>
            </div>
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
        </div>
      </main>
    </>
  );
}
