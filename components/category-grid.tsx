"use client"

import Link from "next/link"

const categories = [
  {
    name: "POINT & SHOOT",
    subtitle: "CAMERAS",
    href: "/shop?category=camera",
    bgColor: "bg-pop-yellow",
    textColor: "text-pop-pink",
    image: "/category-point-shoot-v2.png",
  },
  {
    name: "PREMIUM",
    subtitle: "CAMERAS",
    href: "/shop?category=camera",
    bgColor: "bg-pop-pink",
    textColor: "text-pop-yellow",
    image: "/category-premium-v2.png",
  },
  {
    name: "MEMORY",
    subtitle: "CARDS",
    href: "/shop?category=accessory&sub=memory",
    bgColor: "bg-pop-teal",
    textColor: "text-pop-yellow",
    image: "/category-memory-v2.png",
  },
]

const bottomCategories = [
  {
    name: "CAMERA",
    subtitle: "CASES",
    href: "/shop?category=accessory&sub=case",
    bgColor: "bg-pop-pink",
    textColor: "text-foreground",
    image: "/category-cases-v2.png",
  },
  {
    name: "STRAPS &",
    subtitle: "ACCESSORIES",
    href: "/shop?category=accessory",
    bgColor: "bg-pop-yellow",
    textColor: "text-pop-teal",
    image: "/category-straps-v2.png",
  },
]

function CornerTriangle({ position, color }: { position: "tl" | "tr" | "bl" | "br"; color: string }) {
  const positionClasses = {
    tl: "top-0 left-0",
    tr: "top-0 right-0 rotate-90",
    bl: "bottom-0 left-0 -rotate-90",
    br: "bottom-0 right-0 rotate-180",
  }

  return (
    <div className={`absolute ${positionClasses[position]} w-3 h-3 md:w-6 md:h-6 lg:w-8 lg:h-8 hidden sm:block`}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <polygon points="0,0 24,0 0,24" className={color} fill="currentColor" />
      </svg>
    </div>
  )
}

function StripedBorder({ orientation }: { orientation: "horizontal" | "vertical" }) {
  if (orientation === "horizontal") {
    return <div className="h-2 md:h-4 lg:h-6 w-full stripes-yellow" />
  }
  return <div className="w-2 md:w-4 lg:w-6 h-full stripes-yellow" />
}

export function CategoryGrid() {
  return (
    <section className="py-0 bg-foreground">
      <StripedBorder orientation="horizontal" />

      <div className="flex">
        <StripedBorder orientation="vertical" />

        <div className="flex-1">
          {/* Top row - 3 cards */}
          <div className="grid grid-cols-3 gap-0">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`group relative ${cat.bgColor} overflow-hidden flex flex-col`}
              >
                <CornerTriangle position="tl" color={cat.textColor} />
                <CornerTriangle position="tr" color={cat.textColor} />
                <CornerTriangle position="bl" color={cat.textColor} />
                <CornerTriangle position="br" color={cat.textColor} />

                <div className="p-2 sm:p-3 md:p-4 lg:p-6 flex-shrink-0">
                  <h3
                    className={`text-xs sm:text-base md:text-xl lg:text-3xl xl:text-4xl font-black ${cat.textColor} leading-tight tracking-tight uppercase`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    <span className="block">{cat.name}</span>
                    <span className="block opacity-90">{cat.subtitle}</span>
                  </h3>
                </div>

                <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 lg:pb-8 flex items-center justify-center min-h-[140px] sm:min-h-[180px] md:min-h-[240px] lg:min-h-[320px]">
                  <div className="relative w-full h-full flex items-center justify-center aspect-square">
                    <img
                      src={cat.image || "/placeholder.svg"}
                      alt={`${cat.name} ${cat.subtitle}`}
                      className="w-full h-full object-contain mix-blend-multiply opacity-95 drop-shadow-2xl animate-float transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        animationDelay: `${categories.indexOf(cat) * 0.3}s`,
                        animationDuration: `${4 + categories.indexOf(cat) * 0.5}s`
                      }}
                    />
                  </div>
                </div>

                <div className="pb-3 sm:pb-4 md:pb-6 lg:pb-8 flex justify-center">
                  <span className="bg-foreground text-background text-[10px] sm:text-xs md:text-sm font-bold px-4 py-1.5 sm:px-6 sm:py-2 md:px-10 md:py-3 uppercase tracking-widest group-hover:bg-background group-hover:text-foreground transition-all duration-300 shadow-lg group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] relative overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-white/10 after:translate-x-[-100%] after:skew-x-[-15deg] group-hover:after:animate-[shimmer_2s_infinite]">
                    Shop
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <StripedBorder orientation="horizontal" />

          {/* Bottom row - 2 cards */}
          <div className="grid grid-cols-2 gap-0">
            {bottomCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`group relative ${cat.bgColor} overflow-hidden flex flex-col border-foreground/5 hover:z-10 transition-transform duration-500 hover:-translate-y-1`}
              >
                <CornerTriangle position="tl" color={cat.textColor} />
                <CornerTriangle position="tr" color={cat.textColor} />
                <CornerTriangle position="bl" color={cat.textColor} />
                <CornerTriangle position="br" color={cat.textColor} />

                <div className="p-2 sm:p-3 md:p-4 lg:p-6 flex-shrink-0">
                  <h3
                    className={`text-sm sm:text-lg md:text-2xl lg:text-4xl xl:text-5xl font-black ${cat.textColor} leading-tight tracking-tight uppercase text-balance`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    <span className="block">{cat.name}</span>
                    <span className="block opacity-90">{cat.subtitle}</span>
                  </h3>
                </div>

                <div className="flex-1 px-4 sm:px-8 md:px-12 lg:px-16 pb-4 sm:pb-8 md:pb-12 lg:pb-16 flex items-center justify-center min-h-[120px] sm:min-h-[160px] md:min-h-[220px] lg:min-h-[300px]">
                  <div className="relative w-full h-full flex items-center justify-center aspect-[4/3]">
                    <img
                      src={cat.image || "/placeholder.svg"}
                      alt={`${cat.name} ${cat.subtitle}`}
                      className="w-full h-full object-contain mix-blend-multiply opacity-95 drop-shadow-2xl animate-float transition-all duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3"
                      style={{
                        animationDelay: `${(bottomCategories.indexOf(cat) + 3) * 0.4}s`,
                        animationDuration: `${5 + bottomCategories.indexOf(cat) * 0.5}s`
                      }}
                    />
                  </div>
                </div>

                <div className="pb-3 sm:pb-4 md:pb-6 lg:pb-8 flex justify-center">
                  <span className="bg-foreground text-background text-[10px] sm:text-xs md:text-sm font-bold px-4 py-1.5 sm:px-6 sm:py-2 md:px-10 md:py-3 uppercase tracking-widest group-hover:bg-background group-hover:text-foreground transition-all duration-300 shadow-lg relative overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-white/10 after:translate-x-[-100%] after:skew-x-[-15deg] group-hover:after:animate-[shimmer_2s_infinite]">
                    Shop
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <StripedBorder orientation="vertical" />
      </div>

      <StripedBorder orientation="horizontal" />
    </section>
  )
}
