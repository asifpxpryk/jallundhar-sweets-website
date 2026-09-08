import PromoBanner from "./PromoBanner";

const GHEE_OVERLAY =
  "linear-gradient(90deg, #f4e6c8 0%, #f4e6c8 34%, rgba(244,230,200,0.74) 50%, rgba(244,230,200,0.28) 64%, rgba(244,230,200,0) 78%)";

export default function GheePromoBanner() {
  return (
    <PromoBanner
      image="/images/desi-ghee-banner.webp"
      alt="Khaalis desi ghee with paratha"
      overlay={GHEE_OVERLAY}
      imageClassName="object-[42%_center] sm:object-[72%_center]"
      overlayClassName="bg-gradient-to-r from-[#f4e6c8] from-[8%] via-[#f4e6c8]/40 via-[28%] to-transparent to-[52%] sm:from-[#f4e6c8] sm:from-[34%] sm:via-[#f4e6c8]/75 sm:via-[50%] sm:to-transparent sm:to-[78%]"
    >
      <h2 className="origin-left scale-x-[0.88] font-serif text-lg font-bold leading-[1.38] tracking-tighter sm:scale-x-[0.94] sm:text-2xl sm:leading-[1.35] lg:text-3xl">
        <span className="block text-[#2e3b23]">Start your day with a</span>
        <span className="block text-[#8c4521]">desi ghee paratha</span>
        <span className="block text-[#2e3b23]">for a healthy life</span>
      </h2>
      <div className="mt-0.5 h-px w-20 rounded-full bg-[#c5b358] sm:w-32" />
      <p className="origin-left scale-x-[0.9] font-serif text-[10px] leading-snug tracking-tight text-[#2e3b23] sm:scale-x-[0.94] sm:text-sm">
        Pure Goodness &nbsp;|&nbsp; Traditional Taste
      </p>
      <p className="origin-left scale-x-[0.9] font-serif text-[10px] leading-snug tracking-tight text-[#2e3b23] sm:scale-x-[0.94] sm:text-sm">
        Rich Aroma &nbsp;|&nbsp; Wholesome Nourishment
      </p>
    </PromoBanner>
  );
}
