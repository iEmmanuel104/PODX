import Image from "next/image";

const Logo = () => (
    <h1 className="text-3xl font-bold flex items-center space-x-2">
        {/* <span className="text-primary text-white">POD</span> */}
        <div className="relative w-20 h-20">
            <Image src="/logo.png" layout="fill" objectFit="contain" alt="Podx" />
        </div>
    </h1>
);

export default Logo;