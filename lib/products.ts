export interface Product {
  id: string
  name: string
  brand: string
  description: string
  longDescription?: string // Added detailed description for product pages
  priceInCents: number
  originalPriceInCents?: number
  images: string[]
  badge?: string
  year: string
  category: "camera" | "accessory"
  subcategory?: string
  condition: string
  specs: {
    megapixels?: string
    zoom?: string
    display?: string
    storage?: string
    capacity?: string
    compatibility?: string
    material?: string
    size?: string
  }
  features?: string[] // Added features list for product pages
  inStock: boolean
  stockCount?: number // Real stock level - only show if actually tracked
  reviewCount?: number // Real review count from database
  rating?: number // Real average rating from database reviews
  isTrending?: boolean // Manually curated, updated weekly
  isBestseller?: boolean // Based on actual sales data, updated weekly
}

export const PRODUCTS: Product[] = [
  // Cameras
  {
    id: "sony-cybershot-dsc-p200",
    name: "Sony Cybershot DSC-P200",
    brand: "Sony",
    description:
      "A stunning silver compact camera from Sony's iconic Cybershot line. Features Carl Zeiss optics and a sleek metallic body that defined the Y2K aesthetic.",
    longDescription:
      "The Sony Cybershot DSC-P200 represents the pinnacle of mid-2000s compact camera design. Its machined aluminum body feels premium in hand, while the Carl Zeiss Vario-Tessar lens delivers exceptional sharpness and color accuracy. This particular unit has been professionally inspected, cleaned, and tested. The sensor produces vibrant 7.2MP images with that characteristic warm, filmic quality that modern smartphones simply cannot replicate. Perfect for street photography, travel, or anyone seeking that authentic Y2K aesthetic in their photos.",
    features: [
      "Carl Zeiss Vario-Tessar lens",
      "Real Imaging Processor for fast performance",
      "Clear Photo LCD Plus screen",
      "Stamina battery life up to 360 shots",
      "Multi-point autofocus system",
    ],
    priceInCents: 8900,
    originalPriceInCents: 12000,
    images: [
      "/sony-cybershot-silver-digital-camera-y2k-front-vie.jpg",
      "/sony-cybershot-silver-digital-camera-y2k-back-lcd.jpg",
    ],
    badge: "Best Seller",
    year: "2005",
    category: "camera",
    condition: "Excellent",
    specs: {
      megapixels: "7.2 MP",
      zoom: "3x Optical",
      display: '2.0" LCD',
      storage: "Memory Stick Pro Duo",
    },
    inStock: true,
    stockCount: 2,
    reviewCount: 10,
    rating: 4.5,
    isTrending: true,
    isBestseller: true,
  },
  {
    id: "canon-powershot-a520",
    name: "Canon PowerShot A520",
    brand: "Canon",
    description:
      "Reliable and user-friendly, the PowerShot A520 delivers excellent image quality with Canon's renowned color science. Perfect for everyday memories.",
    longDescription:
      "Canon's PowerShot A520 was the go-to camera for families and casual photographers in the mid-2000s—and for good reason. Canon's legendary DIGIC processor ensures fast operation and accurate colors, while the 4x optical zoom gives you flexibility without bulk. This unit runs on standard AA batteries, making it incredibly practical for travel. The intuitive controls and reliable autofocus make it perfect for beginners, while the manual modes satisfy more experienced shooters. Every shot has that warm, nostalgic Canon color science.",
    features: [
      "DIGIC image processor",
      "9-point AiAF autofocus",
      "Uses common AA batteries",
      "Compact and lightweight design",
      "Multiple scene modes included",
    ],
    priceInCents: 6500,
    images: [
      "/canon-powershot-silver-compact-digital-camera-y2k.jpg",
      "/canon-powershot-digital-camera-top-view-y2k.jpg",
    ],
    year: "2005",
    category: "camera",
    condition: "Very Good",
    specs: {
      megapixels: "4.0 MP",
      zoom: "4x Optical",
      display: '1.8" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 5,
    reviewCount: 8,
    rating: 4.0,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "fujifilm-finepix-z5fd",
    name: "Fujifilm FinePix Z5fd",
    brand: "Fujifilm",
    description:
      "The iconic pink FinePix that became a fashion accessory. Features face detection technology and a sliding lens cover design.",
    longDescription:
      "Few cameras capture the Y2K aesthetic quite like the Fujifilm FinePix Z5fd. This stunning pink model was as much a fashion statement as it was a capable camera. The innovative face detection technology was cutting-edge for 2007, automatically finding and focusing on up to 10 faces in a frame. The sliding lens cover design protects the optics while adding to its sleek appeal. Fujifilm's renowned color science produces vibrant, punchy images that look incredible on social media. A true collector's piece that still takes beautiful photos.",
    features: [
      "Face Detection technology",
      "Sliding lens cover design",
      "Internal memory + xD card slot",
      "Fujifilm Super CCD sensor",
      "15 scene modes",
    ],
    priceInCents: 11000,
    images: ["/fujifilm-finepix-pink-digital-camera-cute-y2k.jpg", "/pink-digital-camera-y2k-aesthetic-back.jpg"],
    badge: "New Arrival",
    year: "2007",
    category: "camera",
    condition: "Like New",
    specs: {
      megapixels: "6.3 MP",
      zoom: "3x Optical",
      display: '2.5" LCD',
      storage: "xD-Picture Card",
    },
    inStock: true,
    stockCount: 1,
    reviewCount: 12,
    rating: 4.7,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "olympus-fe-280",
    name: "Olympus FE-280",
    brand: "Olympus",
    description:
      "Compact and colorful, this metallic blue Olympus delivers sharp images with its advanced image stabilization system.",
    longDescription:
      "The Olympus FE-280 stands out with its striking metallic blue finish and impressive 8MP sensor. Olympus packed serious imaging technology into this compact body, including their advanced image stabilization system that reduces blur from camera shake. The bright 2.5-inch LCD makes composing and reviewing shots a pleasure. This camera excels in automatic mode but also offers enough manual control for creative experimentation. The vibrant blue color has become increasingly sought-after by collectors.",
    features: [
      "Digital Image Stabilization",
      "Bright 2.5-inch LCD",
      "Face Detection AF",
      "19 scene modes",
      "In-camera red-eye fix",
    ],
    priceInCents: 5500,
    originalPriceInCents: 7500,
    images: ["/olympus-blue-metallic-digital-camera-compact-y2k.jpg", "/olympus-digital-camera-blue-back-view-y2k.jpg"],
    year: "2007",
    category: "camera",
    condition: "Good",
    specs: {
      megapixels: "8.0 MP",
      zoom: "3x Optical",
      display: '2.5" LCD',
      storage: "xD-Picture Card",
    },
    inStock: true,
    stockCount: 3,
    reviewCount: 9,
    rating: 4.3,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "nikon-coolpix-s500",
    name: "Nikon Coolpix S500",
    brand: "Nikon",
    description:
      "Ultra-slim and sophisticated, the S500 features Nikon's legendary optics in a pocket-friendly form factor. VR image stabilization included.",
    longDescription:
      "Nikon's Coolpix S500 represents the perfect marriage of style and substance. At just 22mm thin, it slips easily into any pocket, yet houses Nikon's renowned Nikkor optics and genuine VR (Vibration Reduction) technology. The brushed aluminum body feels premium and sophisticated. This camera was ahead of its time with features like D-Lighting for recovering shadow detail and in-camera red-eye fix. Every image benefits from Nikon's decades of optical expertise, producing sharp, well-balanced photos.",
    features: [
      "Genuine VR image stabilization",
      "Nikkor ED glass lens",
      "D-Lighting technology",
      "Ultra-slim 22mm body",
      "High-sensitivity ISO 2000",
    ],
    priceInCents: 9500,
    images: ["/nikon-coolpix-silver-slim-digital-camera-y2k.jpg", "/nikon-coolpix-silver-camera-sleek-back-y2k.jpg"],
    year: "2007",
    category: "camera",
    condition: "Excellent",
    specs: {
      megapixels: "7.1 MP",
      zoom: "3x Optical",
      display: '2.5" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 4,
    reviewCount: 7,
    rating: 4.6,
    isTrending: false,
    isBestseller: true,
  },
  {
    id: "kodak-easyshare-v610",
    name: "Kodak EasyShare V610",
    brand: "Kodak",
    description:
      "A rare dual-lens camera offering both wide-angle and telephoto capabilities. The unique design makes this a collector's piece.",
    longDescription:
      "The Kodak EasyShare V610 is one of the most innovative cameras of the digital era. Its revolutionary dual-lens system provides an incredible 10x zoom range by seamlessly switching between two separate lens units—something no other compact camera has replicated. The wide-angle lens is perfect for landscapes and group shots, while the telephoto lens brings distant subjects close. Kodak's legendary color science produces warm, vibrant images reminiscent of their film heritage. A true collector's item and conversation starter.",
    features: [
      "Revolutionary dual-lens design",
      "10x total optical zoom range",
      "Kodak Color Science technology",
      "Bluetooth connectivity",
      "Large 2.8-inch LCD",
    ],
    priceInCents: 7800,
    images: ["/kodak-easyshare-v610-black-digital-camera-dual-len.jpg", "/kodak-digital-camera-black-y2k.jpg"],
    badge: "Rare Find",
    year: "2006",
    category: "camera",
    subcategory: "memory",
    condition: "Very Good",
    specs: {
      megapixels: "6.1 MP",
      zoom: "10x Optical (Dual Lens)",
      display: '2.8" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 1,
    reviewCount: 15,
    rating: 4.8,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "samsung-digimax-i6",
    name: "Samsung Digimax i6",
    brand: "Samsung",
    description:
      "Sleek and modern, this Samsung features a beautiful black finish with touch-sensitive controls that were ahead of its time.",
    longDescription:
      "Samsung's Digimax i6 showcased the company's forward-thinking design philosophy with its sleek black finish and innovative touch-sensitive controls. While other manufacturers stuck with physical buttons, Samsung was already exploring touch interfaces. The slim profile and premium materials make this camera feel luxurious in hand. The 2.5-inch LCD was large for its time, and the camera's ASR (Advanced Shake Reduction) technology helps ensure sharp shots. A beautiful example of Korean engineering and design.",
    features: [
      "Touch-sensitive controls",
      "ASR shake reduction",
      "Schneider-Kreuznach lens",
      "Face detection AF",
      "Slim premium design",
    ],
    priceInCents: 7200,
    images: ["/samsung-digimax-i6-black-slim-digital-camera.jpg", "/samsung-digital-camera-sleek-black.jpg"],
    year: "2006",
    category: "camera",
    condition: "Good",
    specs: {
      megapixels: "6.0 MP",
      zoom: "3x Optical",
      display: '2.5" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 6,
    reviewCount: 11,
    rating: 4.4,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "pentax-optio-s7",
    name: "Pentax Optio S7",
    brand: "Pentax",
    description:
      "Incredibly compact with a retractable sliding lens, the Optio S7 fits in the smallest pockets while delivering impressive image quality.",
    longDescription:
      "The Pentax Optio S7 was an engineering marvel—one of the smallest 7MP cameras ever made, yet packed with features. The sliding lens system retracts completely flat, allowing the camera to slip into the tightest jean pockets. Despite its diminutive size, Pentax didn't compromise on image quality. The smc Pentax lens coating reduces flare and ghosting, while the shake reduction feature helps in low light. This camera proves that great things really do come in small packages.",
    features: [
      "Ultra-compact sliding lens design",
      "smc Pentax lens coating",
      "Shake reduction technology",
      "Movie recording with sound",
      "21 scene modes",
    ],
    priceInCents: 6800,
    images: [
      "/pentax-optio-s7-silver-compact-digital-camera.jpg",
      "/silver-compact-digital-camera-y2k-vintage-point-an.jpg",
    ],
    badge: "Staff Pick",
    year: "2005",
    category: "camera",
    condition: "Excellent",
    specs: {
      megapixels: "7.0 MP",
      zoom: "3x Optical",
      display: '2.5" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 2,
    reviewCount: 13,
    rating: 4.6,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "casio-exilim-ex-z75",
    name: "Casio Exilim EX-Z75",
    brand: "Casio",
    description:
      "Part of the legendary Exilim line known for ultra-thin designs. Features YouTube capture mode for the early video sharing era.",
    longDescription:
      "The Casio Exilim EX-Z75 was built for the emerging social media age. Its YouTube Capture Mode was revolutionary—recording video in the exact format needed for easy uploading to the nascent video platform. The Exilim line was famous for its impossibly thin designs, and the Z75 continued that tradition while packing in a 7.2MP sensor and Casio's Anti-Shake DSP. The brushed metal body and minimalist design aesthetic make it a timeless piece. A camera that perfectly bridges the gap between the digital camera era and the smartphone age.",
    features: ["YouTube Capture Mode", "Anti-Shake DSP", "Best Shot modes", "Ultra-thin design", "Quick startup time"],
    priceInCents: 8500,
    images: [
      "/casio-exilim-ex-z75-silver-slim-digital-camera.jpg",
      "/collection-of-compact-digital-cameras-y2k-era-silv.jpg",
    ],
    badge: "Iconic Design",
    year: "2007",
    category: "camera",
    condition: "Like New",
    specs: {
      megapixels: "7.2 MP",
      zoom: "3x Optical",
      display: '2.6" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 1,
    reviewCount: 14,
    rating: 4.7,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "panasonic-lumix-dmc-fx01",
    name: "Panasonic Lumix DMC-FX01",
    brand: "Panasonic",
    description:
      "Features Leica optics and a wide-angle lens perfect for group shots. The MEGA O.I.S. stabilization was groundbreaking for its time.",
    longDescription:
      "When you see 'Leica' on a lens, you know you're getting something special. The Panasonic Lumix DMC-FX01 features a genuine Leica DC Vario-Elmarit lens that delivers stunning sharpness and beautiful bokeh. The 28mm wide-angle capability was rare in compact cameras and perfect for landscapes and group photos. Panasonic's MEGA O.I.S. (Optical Image Stabilization) was among the best in class, allowing sharp handheld shots in challenging light. This partnership between Panasonic and Leica produced some of the finest compact cameras ever made.",
    features: [
      "Leica DC Vario-Elmarit lens",
      "MEGA O.I.S. stabilization",
      "28mm wide-angle",
      "Venus Engine III processor",
      "Intelligent ISO Control",
    ],
    priceInCents: 9900,
    originalPriceInCents: 12500,
    images: [
      "/panasonic-lumix-dmc-fx01-silver-digital-camera-lei.jpg",
      "/premium-digital-cameras-early-2000s-professional.jpg",
    ],
    badge: "Leica Lens",
    year: "2006",
    category: "camera",
    condition: "Very Good",
    specs: {
      megapixels: "6.0 MP",
      zoom: "3.6x Optical",
      display: '2.5" LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 3,
    reviewCount: 12,
    rating: 4.5,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "sony-cybershot-dsc-t9",
    name: "Sony Cybershot DSC-T9",
    brand: "Sony",
    description:
      "The ultra-slim T-series with a sliding lens cover became an icon of Y2K tech design. Carl Zeiss lens ensures stunning image quality.",
    longDescription:
      "The Sony Cybershot DSC-T9 is perhaps the most iconic camera of the Y2K era. Its sliding lens cover mechanism was endlessly satisfying—a simple slide and you're ready to shoot. The Carl Zeiss Vario-Tessar lens delivers exceptional image quality in an impossibly thin body. Sony's Super SteadyShot optical stabilization ensures sharp images even in low light. The T-series defined what a 'cool' camera looked like in the mid-2000s, and the T9 remains highly sought after by collectors and photographers who appreciate its timeless design.",
    features: [
      "Carl Zeiss Vario-Tessar lens",
      "Super SteadyShot optical stabilization",
      "Iconic sliding lens cover",
      "Clear Photo LCD Plus",
      "High sensitivity mode",
    ],
    priceInCents: 12500,
    images: [
      "/sony-cybershot-dsc-t9-silver-slim-sliding-camera.jpg",
      "/vintage-sony-cybershot-digital-camera-silver-y2k.jpg",
    ],
    badge: "Iconic Design",
    year: "2005",
    category: "camera",
    condition: "Excellent",
    specs: {
      megapixels: "6.0 MP",
      zoom: "3x Optical",
      display: '2.5" LCD',
      storage: "Memory Stick Pro Duo",
    },
    inStock: true,
    stockCount: 1,
    reviewCount: 16,
    rating: 4.9,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "hp-photosmart-r817",
    name: "HP Photosmart R817",
    brand: "HP",
    description:
      "A versatile camera with HP's instant share feature. The swivel LCD screen was innovative for self-portraits before selfies existed.",
    longDescription:
      "Before front-facing smartphone cameras, there was the HP Photosmart R817. Its innovative swivel LCD screen rotated to face forward, making self-portraits easy years before the word 'selfie' entered our vocabulary. HP's Instant Share technology allowed you to tag photos for easy sharing when you connected to your computer. The 5x optical zoom provides excellent versatility, while HP's Real Life Technologies automatically enhance your images. A forward-thinking camera that predicted how we'd use photography in the social media age.",
    features: [
      "Swivel LCD for self-portraits",
      "HP Instant Share technology",
      "5x optical zoom",
      "Real Life Technologies",
      "In-camera panorama mode",
    ],
    priceInCents: 5900,
    images: ["/hp-photosmart-r817-silver-digital-camera-swivel-sc.jpg", "/collection-of-vintage-cameras.jpg"],
    year: "2005",
    category: "camera",
    condition: "Good",
    specs: {
      megapixels: "5.1 MP",
      zoom: "5x Optical",
      display: '2.5" Swivel LCD',
      storage: "SD Card",
    },
    inStock: true,
    stockCount: 4,
    reviewCount: 10,
    rating: 4.2,
    isTrending: false,
    isBestseller: false,
  },

  // Accessories - Memory Cards
  {
    id: "sd-card-2gb",
    name: "SD Card 2GB",
    brand: "SanDisk",
    description: "Perfect capacity for Y2K cameras. Compatible with most compact cameras from 2004-2010.",
    longDescription:
      "The 2GB SD card hits the sweet spot for vintage digital cameras. It provides enough storage for hundreds of photos at typical Y2K resolutions while being fully compatible with older card readers and camera firmware. SanDisk's proven reliability means your precious memories are safe. This capacity was considered 'huge' in the mid-2000s and remains perfect for authentic vintage shooting without worrying about running out of space.",
    features: [
      "Universal SD compatibility",
      "Holds 500+ photos at 5MP",
      "Works with older card readers",
      "Reliable SanDisk quality",
      "Perfect for vintage cameras",
    ],
    priceInCents: 1200,
    images: ["/sd-card-2gb-sandisk-blue.jpg", "/sd-card-2gb-sandisk-angle.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "memory",
    condition: "New",
    specs: {
      capacity: "2GB",
      compatibility: "SD Card Slot",
    },
    inStock: true,
    stockCount: 10,
    reviewCount: 5,
    rating: 4.0,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "sd-card-4gb",
    name: "SD Card 4GB",
    brand: "SanDisk",
    description: "Higher capacity for more photos. Great for cameras with larger megapixel counts.",
    longDescription:
      "Step up to 4GB for extended shooting sessions. This capacity is ideal for 6-8MP cameras where file sizes are larger. You'll get over 1000 photos per card, perfect for vacations or events where you don't want to swap cards. The faster write speeds also improve camera performance, reducing the wait time between shots. A practical upgrade that extends your shooting time significantly.",
    features: [
      "1000+ photos at 7MP",
      "Faster write speeds",
      "Great for video clips",
      "Extended shooting sessions",
      "Premium SanDisk reliability",
    ],
    priceInCents: 1800,
    images: ["/sd-card-4gb-sandisk-red.jpg", "/sd-card-4gb-close-up.jpg"],
    badge: "Popular",
    year: "2000s",
    category: "accessory",
    subcategory: "memory",
    condition: "New",
    specs: {
      capacity: "4GB",
      compatibility: "SD Card Slot",
    },
    inStock: true,
    stockCount: 8,
    reviewCount: 10,
    rating: 4.5,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "memory-stick-pro-duo-1gb",
    name: "Memory Stick Pro Duo 1GB",
    brand: "Sony",
    description: "Essential for Sony Cybershot cameras. Original Sony format memory card.",
    longDescription:
      "If you own a Sony Cybershot, this is your card. The Memory Stick Pro Duo was Sony's proprietary format, and while it may seem inconvenient today, it offered excellent performance for its time. This genuine Sony card ensures full compatibility and reliable operation with your Cybershot. The 1GB capacity provides plenty of room for photos while being recognized by all Sony cameras of the era. An essential accessory for Sony camera owners.",
    features: [
      "Genuine Sony quality",
      "Full Cybershot compatibility",
      "MagicGate copyright protection",
      "High-speed PRO performance",
      "Compact form factor",
    ],
    priceInCents: 2200,
    images: ["/memory-stick-pro-duo-sony-purple.jpg", "/memory-stick-pro-duo-packaging.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "memory",
    condition: "New",
    specs: {
      capacity: "1GB",
      compatibility: "Sony Cybershot",
    },
    inStock: true,
    stockCount: 5,
    reviewCount: 8,
    rating: 4.3,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "xd-picture-card-512mb",
    name: "xD-Picture Card 512MB",
    brand: "Olympus",
    description: "Required for Olympus and Fujifilm cameras. Increasingly rare format.",
    longDescription:
      "The xD-Picture Card was developed jointly by Olympus and Fujifilm as a compact storage solution. While the format has been discontinued, many beloved cameras from both brands require it. Finding these cards in good condition is increasingly difficult, making this a valuable find for Olympus FE and Fujifilm FinePix owners. The 512MB capacity is ample for typical use. Don't let your vintage camera sit unused—get the card it needs.",
    features: [
      "Required for Olympus/Fujifilm",
      "Increasingly rare format",
      "Ultra-compact size",
      "Good for 200+ photos",
      "Tested and verified",
    ],
    priceInCents: 2500,
    images: ["/xd-picture-card-olympus.jpg", "/xd-picture-card-fujifilm-package.jpg"],
    badge: "Rare",
    year: "2000s",
    category: "accessory",
    subcategory: "memory",
    condition: "New",
    specs: {
      capacity: "512MB",
      compatibility: "Olympus, Fujifilm",
    },
    inStock: true,
    stockCount: 3,
    reviewCount: 9,
    rating: 4.4,
    isTrending: false,
    isBestseller: false,
  },

  // Cases
  {
    id: "camera-case-compact",
    name: "Retro Camera Case - Compact",
    brand: "MeasureJoy",
    description: "Padded neoprene case with belt loop. Fits most compact Y2K cameras perfectly.",
    longDescription:
      "Protect your vintage camera in style with our compact neoprene case. The stretchy neoprene material provides excellent shock absorption while conforming to your camera's shape. The belt loop lets you keep your camera accessible while the zippered closure keeps it secure. Interior soft lining prevents scratches on your camera's body and screen. Available in classic black, this case complements any camera from our collection.",
    features: [
      "Shock-absorbing neoprene",
      "Universal compact fit",
      "Belt loop attachment",
      "Scratch-free interior",
      "Secure zipper closure",
    ],
    priceInCents: 1500,
    images: ["/camera-case-neoprene-black.jpg", "/camera-case-neoprene-open.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "case",
    condition: "New",
    specs: {
      material: "Neoprene",
      size: "Compact",
    },
    inStock: true,
    stockCount: 7,
    reviewCount: 12,
    rating: 4.6,
    isTrending: true,
    isBestseller: false,
  },
  {
    id: "camera-case-hard",
    name: "Hard Shell Camera Case",
    brand: "MeasureJoy",
    description: "Ultimate protection with hard EVA shell. Includes foam insert and carabiner clip.",
    longDescription:
      "For maximum protection, our hard shell EVA case is the answer. The rigid exterior withstands impacts, drops, and crushing forces that would damage softer cases. Inside, custom-cut foam cradles your camera securely. The included carabiner clip attaches to bags, belt loops, or anywhere you need quick access. Water-resistant construction protects against light rain and splashes. If you're taking your vintage camera on adventures, this case is essential.",
    features: [
      "Crush-resistant EVA shell",
      "Custom foam insert",
      "Carabiner clip included",
      "Water-resistant exterior",
      "Secure zipper with pull tab",
    ],
    priceInCents: 2400,
    images: ["/camera-case-hard-shell-silver.jpg", "/camera-case-hard-shell-interior.jpg"],
    badge: "Best Protection",
    year: "2000s",
    category: "accessory",
    subcategory: "case",
    condition: "New",
    specs: {
      material: "EVA Hard Shell",
      size: "Universal",
    },
    inStock: true,
    stockCount: 6,
    reviewCount: 15,
    rating: 4.8,
    isTrending: true,
    isBestseller: false,
  },

  // Straps
  {
    id: "wrist-strap-leather",
    name: "Leather Wrist Strap",
    brand: "MeasureJoy",
    description: "Premium leather wrist strap with adjustable length. Adds vintage charm to any camera.",
    longDescription:
      "Elevate your camera's look with our premium leather wrist strap. Crafted from genuine full-grain leather that develops a beautiful patina over time. The adjustable loop fits any wrist size comfortably, while the secure attachment point keeps your camera safe. Unlike neck straps, wrist straps keep your camera ready for quick shots while preventing drops. The rich brown color complements the silver and black cameras in our collection beautifully.",
    features: [
      "Genuine full-grain leather",
      "Develops unique patina",
      "Adjustable wrist loop",
      "Universal camera attachment",
      "Handcrafted quality",
    ],
    priceInCents: 1800,
    images: ["/wrist-strap-leather-brown.jpg", "/wrist-strap-leather-detail.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "strap",
    condition: "New",
    specs: {
      material: "Genuine Leather",
      compatibility: "Universal",
    },
    inStock: true,
    stockCount: 4,
    reviewCount: 10,
    rating: 4.5,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "neck-strap-colorful",
    name: "Y2K Colorful Neck Strap",
    brand: "MeasureJoy",
    description: "Vibrant patterned neck strap that matches the Y2K aesthetic. Padded for comfort.",
    longDescription:
      "Nothing says Y2K like bold, colorful patterns. Our neck strap features vibrant geometric designs that perfectly complement the era's aesthetic. The wide, padded construction distributes weight comfortably even during long shooting sessions. Quick-release clips make attachment and removal easy, while the adjustable length fits all body types. Make your vintage camera a true fashion statement.",
    features: [
      "Authentic Y2K patterns",
      "Padded for all-day comfort",
      "Quick-release clips",
      "Fully adjustable length",
      "Machine washable",
    ],
    priceInCents: 1400,
    images: ["/neck-strap-colorful-y2k-pattern.jpg", "/neck-strap-colorful-on-camera.jpg"],
    badge: "Fan Favorite",
    year: "2000s",
    category: "accessory",
    subcategory: "strap",
    condition: "New",
    specs: {
      material: "Nylon/Polyester",
      compatibility: "Universal",
    },
    inStock: true,
    stockCount: 5,
    reviewCount: 11,
    rating: 4.4,
    isTrending: false,
    isBestseller: false,
  },

  // Protection & Maintenance
  {
    id: "screen-protector-pack",
    name: "LCD Screen Protector (3-Pack)",
    brand: "MeasureJoy",
    description: "Protect your precious LCD screen. Cut-to-fit universal design works with any camera.",
    longDescription:
      "Vintage camera LCD screens are irreplaceable—protect yours with our screen protector pack. The cut-to-fit design works with any camera screen size. Simply trim to shape and apply bubble-free. The ultra-clear material maintains screen visibility while protecting against scratches, fingerprints, and minor impacts. You get three protectors in each pack, enough to protect your entire collection or provide spares for the future.",
    features: [
      "Universal cut-to-fit design",
      "Crystal clear visibility",
      "Bubble-free application",
      "Scratch and fingerprint resistant",
      "3 protectors per pack",
    ],
    priceInCents: 800,
    images: ["/lcd-screen-protector-pack.jpg", "/lcd-screen-protector-applying.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "protection",
    condition: "New",
    specs: {
      material: "PET Film",
      compatibility: "Universal - Cut to fit",
    },
    inStock: true,
    stockCount: 9,
    reviewCount: 8,
    rating: 4.3,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "mini-tripod",
    name: "Flexible Mini Tripod",
    brand: "MeasureJoy",
    description: "Bendable legs grip any surface. Perfect for group shots and stable low-light photos.",
    longDescription:
      "Our flexible mini tripod opens up creative possibilities for your vintage camera. The bendable rubber-coated legs wrap around branches, poles, railings—anywhere you need a stable platform. The ball head allows precise angle adjustments. Perfect for long exposures, group shots where you want to be in the frame, or steady video recording. Compact enough to fit in any camera bag, it's the ultimate portable support solution.",
    features: [
      "Flexible wrapping legs",
      "Ball head for angle adjustment",
      "Universal 1/4-inch mount",
      "Supports up to 1kg",
      "Ultra-portable design",
    ],
    priceInCents: 1600,
    images: ["/flexible-mini-tripod-gorillapod.jpg", "/flexible-mini-tripod-with-camera.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "tripod",
    condition: "New",
    specs: {
      material: "Rubber/Metal",
      compatibility: 'Universal 1/4" mount',
    },
    inStock: true,
    stockCount: 6,
    reviewCount: 9,
    rating: 4.4,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "cleaning-kit",
    name: "Camera Cleaning Kit",
    brand: "MeasureJoy",
    description: "Complete kit with microfiber cloth, lens pen, blower, and cleaning solution.",
    longDescription:
      "Keep your vintage camera looking and performing its best with our comprehensive cleaning kit. The air blower removes dust without touching delicate surfaces. The lens pen's carbon tip safely cleans optical surfaces, while the brush end whisks away particles. Premium microfiber cloths clean screens and bodies without scratching. The cleaning solution is safe for all camera finishes. Everything comes in a compact zippered case for easy storage and travel.",
    features: [
      "Air blower for dust removal",
      "Dual-tip lens pen",
      "Premium microfiber cloths",
      "Safe cleaning solution",
      "Zippered carrying case",
    ],
    priceInCents: 1200,
    images: ["/camera-cleaning-kit-complete.jpg", "/camera-cleaning-kit-items.jpg"],
    year: "2000s",
    category: "accessory",
    subcategory: "cleaning",
    condition: "New",
    specs: {
      material: "Various",
      compatibility: "Universal",
    },
    inStock: true,
    stockCount: 7,
    reviewCount: 10,
    rating: 4.5,
    isTrending: false,
    isBestseller: false,
  },
  {
    id: "rechargeable-batteries",
    name: "AA Rechargeable Batteries (4-Pack)",
    brand: "Energizer",
    description: "High-capacity 2500mAh rechargeable batteries. Many Y2K cameras use AA batteries.",
    longDescription:
      "Many beloved Y2K cameras run on AA batteries, and our high-capacity rechargeables are the smart choice. At 2500mAh, these Energizer cells provide significantly more shots per charge than standard batteries. Low self-discharge technology means they hold their charge for months when not in use. Better for your wallet and the environment than disposables. The 4-pack gives you a set in the camera and a set charging—never miss a shot.",
    features: [
      "2500mAh high capacity",
      "Low self-discharge",
      "500+ recharge cycles",
      "Pre-charged and ready to use",
      "Eco-friendly choice",
    ],
    priceInCents: 2200,
    images: ["/rechargeable-batteries-aa-energizer.jpg", "/rechargeable-batteries-in-charger.jpg"],
    badge: "Eco-Friendly",
    year: "2000s",
    category: "accessory",
    subcategory: "power",
    condition: "New",
    specs: {
      capacity: "2500mAh",
      compatibility: "AA Battery Cameras",
    },
    inStock: true,
    stockCount: 8,
    reviewCount: 12,
    rating: 4.7,
    isTrending: true,
    isBestseller: false,
  },
]

export function getCameras(): Product[] {
  return PRODUCTS.filter((p) => p.category === "camera")
}

export function getAccessories(): Product[] {
  return PRODUCTS.filter((p) => p.category === "accessory")
}

export function getAccessoriesBySubcategory(subcategory: string): Product[] {
  return PRODUCTS.filter((p) => p.category === "accessory" && p.subcategory === subcategory)
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.badge && p.category === "camera").slice(0, 6)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

// Upsell suggestions based on camera storage type
export function getUpsellsForCamera(camera: Product): Product[] {
  const accessories = getAccessories()
  const suggestions: Product[] = []

  // Memory card based on camera storage type
  if (camera.specs.storage?.includes("SD")) {
    const sdCards = accessories.filter((a) => a.subcategory === "memory" && a.name.includes("SD Card"))
    if (sdCards.length > 0) suggestions.push(sdCards[0])
  } else if (camera.specs.storage?.includes("Memory Stick")) {
    const msCards = accessories.filter((a) => a.subcategory === "memory" && a.name.includes("Memory Stick"))
    if (msCards.length > 0) suggestions.push(msCards[0])
  } else if (camera.specs.storage?.includes("xD")) {
    const xdCards = accessories.filter((a) => a.subcategory === "memory" && a.name.includes("xD"))
    if (xdCards.length > 0) suggestions.push(xdCards[0])
  }

  // Always suggest case and strap
  const caseItem = accessories.find((a) => a.subcategory === "case")
  const strapItem = accessories.find((a) => a.subcategory === "strap")

  if (caseItem) suggestions.push(caseItem)
  if (strapItem) suggestions.push(strapItem)

  return suggestions.slice(0, 3)
}

export const products = PRODUCTS
