import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LOTTIE_SRC = "/loader.lottie";

export default function WaterLoader({
    message = "Loading SmartWater data...",
    size = 180,
    fullScreen = false
}) {
    return (
        <div
            className={`w-full flex flex-col items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[380px] h-full py-12"
                }`}
        >
            <div style={{ width: size, height: size }} className="flex items-center justify-center">
                <DotLottieReact
                    src={LOTTIE_SRC}
                    loop
                    autoplay
                    style={{ width: "100%", height: "100%" }}
                />
            </div>

            {message && (
                <p className="font-bold text-blue-600 dark:text-blue-400 animate-pulse text-lg mt-2">
                    {message}
                </p>
            )}
        </div>
    );
}