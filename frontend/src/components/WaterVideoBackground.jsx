export default function WaterVideoBackground({ isTeal = false, isPublic = false, role = null }) {
  // Public pages (Landing, Login, Register)
  const videoUrlPublic ="https://www.shutterstock.com/shutterstock/videos/4069617917/preview/stock-footage-super-slow-motion-shot-of-falling-water-isolated-on-black-at-fps.mp4";
  
  // Resident Dashboard
  const videoUrlResident =
    "https://www.shutterstock.com/shutterstock/videos/4029544889/preview/stock-footage-cinematic-close-up-rain-falling-on-ground-with-strong-splashes-moody-background.mp4";

  // Admin Dashboard
  const videoUrlAdmin =
    "https://www.shutterstock.com/shutterstock/videos/4045326943/preview/stock-footage-magical-mesmerizing-blue-sea-with-soft-waves-loopable-for-relaxing-and-calm.mp4";

  const useResidentVideo = !isPublic && (isTeal || role === "ROLE_RESIDENT");
  const videoUrl = isPublic
    ? videoUrlPublic
    : useResidentVideo
      ? videoUrlResident
      : videoUrlAdmin;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-gray-900 pointer-events-none">
      <video key={videoUrl} src={videoUrl} autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-50 mix-blend-screen"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Brand Color Gradient Overlay */}
      <div
        className={`absolute inset-0 mix-blend-overlay ${isTeal
            ? "bg-gradient-to-br from-teal-500/50 to-emerald-800/80"
            : "bg-gradient-to-br from-blue-500/50 to-cyan-800/80"
          }`}
      />

      {/* Readability Veil for Light & Dark Modes */}
      <div className="absolute inset-0 bg-white/35 dark:bg-gray-950/55 transition-colors duration-500" />
    </div>
  );
}