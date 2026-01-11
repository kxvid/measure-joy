"use client"

import Link from "next/link"

const categories = [
  {
    name: "SONY",
    subtitle: "CYBERSHOT",
    href: "/shop?category=camera",
    bgColor: "bg-pop-yellow",
    textColor: "text-pop-pink",
    image: "/sony-cybershot-silver-digital-camera-y2k-front-vie.jpg",
  },
  {
    name: "CANON",
    subtitle: "POWERSHOT",
    href: "/shop?category=camera",
    bgColor: "bg-pop-pink",
    textColor: "text-foreground",
    image: "/canon-powershot-silver-compact-digital-camera-y2k.jpg",
  },
  {
    name: "FUJIFILM",
    subtitle: "FINEPIX",
    href: "/shop?category=camera",
    bgColor: "bg-pop-teal",
    textColor: "text-pop-yellow",
    image: "/fujifilm-finepix-pink-digital-camera-cute-y2k.jpg",
  },
  {
    name: "NIKON",
    subtitle: "COOLPIX",
    href: "/shop?category=camera",
    bgColor: "bg-pop-yellow",
    textColor: "text-pop-teal",
    image: "/nikon-coolpix-silver-slim-digital-camera-y2k.jpg",
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
    <div className={`absolute ${positionClasses[position]} w-5 h-5 lg:w-6 lg:h-6`}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <polygon points="0,0 24,0 0,24" className={color} fill="currentColor" />
      </svg>
    </div>
  )
}

export function AnimatedCategories() {
  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Section header */}
        <div className="text-center mb-8 lg:mb-12">
          <span className="inline-block px-4 py-1 bg-pop-yellow text-foreground text-xs font-bold uppercase tracking-wider mb-4">
            Shop by Brand
          </span>
          <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight">
            Your Favorite <span className="text-pop-pink">Y2K Brands</span>
          </h2>
        </div>

        {/* Brand grid - 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className={`group relative aspect-[3/4] ${cat.bgColor} overflow-hidden`}
            >
              {/* Corner triangles */}
              <CornerTriangle position="tl" color={cat.textColor} />
              <CornerTriangle position="tr" color={cat.textColor} />
              <CornerTriangle position="bl" color={cat.textColor} />
              <CornerTriangle position="br" color={cat.textColor} />

              <div className="absolute inset-6 lg:inset-8 flex items-center justify-center">
                <img
                  src={cat.image || "/placeholder.svg"}
                  alt={`${cat.name} ${cat.subtitle}`}
                  className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
                />
              </div>

              {/* Text overlay */}
              <div className="absolute inset-0 p-3 lg:p-4 flex flex-col justify-between pointer-events-none">
                <div>
                  <h3
                    className={`text-lg sm:text-xl lg:text-2xl font-black ${cat.textColor} leading-none tracking-tight`}
                  >
                    {cat.name}
                  </h3>
                  <h3
                    className={`text-lg sm:text-xl lg:text-2xl font-black ${cat.textColor} leading-none tracking-tight`}
                  >
                    {cat.subtitle}
                  </h3>
                </div>

                {/* Shop button */}
                <div className="flex justify-center pointer-events-auto">
                  <span className="bg-foreground text-background text-xs font-bold px-5 py-2 uppercase tracking-wider group-hover:bg-background group-hover:text-foreground transition-colors">
                    Shop
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
