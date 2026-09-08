import PromoBanner from "./PromoBanner";

export default function WaterPromoBanner() {
  return (
    <PromoBanner
      image="/images/jallundhar-water-banner.jpg"
      alt="Jallundhar premium drinking water bottles"
      overlay=""
      nativeImage
      imageClassName="object-[68%_center] sm:object-[78%_center]"
      overlayClassName="bg-gradient-to-r from-[#d7ebf8] from-[6%] via-[#d7ebf8]/70 via-[28%] to-transparent to-[58%] sm:from-[#d7ebf8] sm:from-[18%] sm:via-[#d7ebf8]/55 sm:via-[38%] sm:to-transparent sm:to-[62%]"
    >
      <h2 className="font-display text-lg leading-snug sm:text-2xl lg:text-[1.75rem]">
        <span className="relative inline-block pr-1">
          <span className="bg-gradient-to-b from-[#2f7cd1] to-[#4eb8e8] bg-clip-text font-bold text-transparent">
            Water
          </span>
          <span className="absolute -bottom-0.5 left-0 h-[3px] w-[2.4rem] rounded-full bg-[#3ec8f0] sm:h-1 sm:w-12" />
        </span>{" "}
        <span className="font-normal text-[#1b3a6b]">is the foundation of life.</span>
      </h2>
      <p className="mt-2 max-w-[16rem] font-display text-[11px] leading-relaxed text-[#1b3a6b] sm:mt-3 sm:max-w-sm sm:text-sm">
        Keep this foundation strong with <span className="font-bold">Jallundhar</span> Pure Drinking Water.
      </p>
    </PromoBanner>
  );
}
