"use client"

import Link from "next/link"

const categories = [
  {
    name: "POINT & SHOOT",
    subtitle: "CAMERAS",
    href: "/shop?category=camera",
    bgColor: "bg-pop-yellow",
    textColor: "text-pop-pink",
    image: "/category-point-shoot.jpg",
  },
  {
    name: "PREMIUM",
    subtitle: "CAMERAS",
    href: "/shop?category=camera",
    bgColor: "bg-pop-pink",
    textColor: "text-pop-yellow",
    image: "/category-premium.jpg",
  },
  {
    name: "MEMORY",
    subtitle: "CARDS",
    href: "/shop?category=accessory&sub=memory",
    bgColor: "bg-pop-teal",
    textColor: "text-pop-yellow",
    image: "/category-memory.jpg",
  },
]

const bottomCategories = [
  {
    name: "CAMERA",
    subtitle: "CASES",
    href: "/shop?category=accessory&sub=case",
    bgColor: "bg-pop-pink",
    textColor: "text-foreground",
    image: "/category-cases.jpg",
  },
  {
    name: "STRAPS &",
    subtitle: "ACCESSORIES",
    href: "/shop?category=accessory",
    bgColor: "bg-pop-yellow",
    textColor: "text-pop-teal",
    image: "/category-straps.jpg",
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
                    className={`text-xs sm:text-base md:text-xl lg:text-3xl xl:text-4xl font-black ${cat.textColor} leading-tight tracking-tight`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    {cat.name}
                  </h3>
                  <h3
                    className={`text-xs sm:text-base md:text-xl lg:text-3xl xl:text-4xl font-black ${cat.textColor} leading-tight tracking-tight`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    {cat.subtitle}
                  </h3>
                </div>

                <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 lg:pb-8 flex items-center justify-center min-h-[120px] sm:min-h-[160px] md:min-h-[200px] lg:min-h-[280px]">
                  <img
                    src={cat.image || "/placeholder.svg"}
                    alt={`${cat.name} ${cat.subtitle}`}
                    className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="pb-2 sm:pb-3 md:pb-4 lg:pb-6 flex justify-center">
                  <span className="bg-foreground text-background text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-bold px-3 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2 lg:px-8 lg:py-2.5 uppercase tracking-wider group-hover:bg-background group-hover:text-foreground transition-colors shadow-md">
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
                className={`group relative ${cat.bgColor} overflow-hidden flex flex-col`}
              >
                <CornerTriangle position="tl" color={cat.textColor} />
                <CornerTriangle position="tr" color={cat.textColor} />
                <CornerTriangle position="bl" color={cat.textColor} />
                <CornerTriangle position="br" color={cat.textColor} />

                <div className="p-2 sm:p-3 md:p-4 lg:p-6 flex-shrink-0">
                  <h3
                    className={`text-xs sm:text-lg md:text-2xl lg:text-4xl xl:text-5xl font-black ${cat.textColor} leading-tight tracking-tight`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    {cat.name}
                  </h3>
                  <h3
                    className={`text-xs sm:text-lg md:text-2xl lg:text-4xl xl:text-5xl font-black ${cat.textColor} leading-tight tracking-tight`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    {cat.subtitle}
                  </h3>
                </div>

                <div className="flex-1 px-3 sm:px-6 md:px-8 lg:px-12 pb-3 sm:pb-6 md:pb-8 lg:pb-12 flex items-center justify-center min-h-[100px] sm:min-h-[140px] md:min-h-[180px] lg:min-h-[220px]">
                  <img
                    src={cat.image || "/placeholder.svg"}
                    alt={`${cat.name} ${cat.subtitle}`}
                    className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="pb-2 sm:pb-3 md:pb-4 lg:pb-6 flex justify-center">
                  <span className="bg-foreground text-background text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-bold px-3 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2 lg:px-8 lg:py-2.5 uppercase tracking-wider group-hover:bg-background group-hover:text-foreground transition-colors shadow-md">
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
