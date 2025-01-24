"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#151515] flex flex-col items-center justify-between p-8 relative">
            {/* Grid Background Pattern */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "50px 50px",
                    opacity: 0.1,
                }}
            />

            {/* Logo */}
            <div className="w-full flex justify-center pt-8">
                <Logo />
            </div>

            {/* Error Content */}
            <div className="flex flex-col items-center justify-center flex-1 gap-6">
                <div className="relative w-32 h-32">
                    <Image
                        src="/images/not-found.png"
                        alt="Sleeping emoji illustration"
                        fill
                        className="w-full h-full bg-cover"
                    />
                    <div className="absolute -top-4 right-0">
                        <span className="text-white text-2xl">z</span>
                        <span className="text-white text-xl translate-y-1 inline-block">z</span>
                        <span className="text-white text-lg translate-y-2 inline-block">z</span>
                    </div>
                </div>
                <h1 className="text-white text-2xl font-semibold">404 Error</h1>
                <Button className="bg-[#DDB958] hover:bg-[#DDB958]/90 text-black px-8" onClick={() => router.push("/")}>
                    Return home
                </Button>
            </div>

            {/* Bottom Spacing */}
            <div className="h-20" />
        </div>
    )
}

