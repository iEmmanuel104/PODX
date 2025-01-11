import type { Metadata } from "next";
import AuthProvider from "@/providers/authProvider";
import localFont from "next/font/local";
import Footer from "@/components/common/Footer";
import RetroGrid from "@/components/ui/retro-grid";

const clashGroteskRegular = localFont({
  src: "../fonts/ClashGrotesk-Regular.woff",
  variable: "--font-clashgrotesk-sans",
  weight: "400",
});
const clashgroteskMedium = localFont({
  src: "../fonts/ClashGrotesk-Medium.woff",
  variable: "--font-clashgrotesk-mono",
  weight: "500",
});

export const metadata: Metadata = {
  title: "Pod X",
  description:
    "Real-time meetings by Podx on chain Using your browser, share your video, desktop.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${clashGroteskRegular.variable} ${clashgroteskMedium.variable} antialiased bg-[#212121] min-h-screen flex justify-center items-center relative`}
    >
      <div className="flex flex-col gap-[250px]">
        <AuthProvider>{children}</AuthProvider>
        <Footer />
      </div>

      <RetroGrid />
    </div>
  );
}
