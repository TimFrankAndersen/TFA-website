/** The current year's predictions - shown big on /predictions. */
export const PREDICTIONS_2026 = [
  {
    title: "OpenAI goes public",
    body: "The most talked-about company in tech finally hits the stock market. One of the largest tech listings in history, and the clearest sign yet that AI has moved to the centre of the global economy.",
  },
  {
    title: "The first one-person unicorn",
    body: "Someone builds a billion-dollar company almost alone: a tiny team with a wall of AI agents doing the work of hundreds. The tools already shipped; 2026 is when someone proves it.",
  },
  {
    title: "Vibecoded AI writes production code",
    body: "Real businesses will let software written mostly by AI run in production, not just prototypes. A big leap of trust - and once one large company admits it works, the rest follow fast.",
  },
  {
    title: "Nvidia holds its lead",
    body: "Everyone is coming for Nvidia, but my bet is they keep the crown through 2026. The moat isn't just the chips; it's the software the whole industry already builds on.",
  },
  {
    title: "Alphabet becomes the world's most valuable company",
    body: "Google was written off in the AI race. I think the opposite happens: with Gemini, its own chips and an unrivalled search business, Alphabet climbs to #1 by market cap.",
  },
  {
    title: "No AI bubble crash",
    body: "Everyone's waiting for the bubble to pop. I don't think it does in 2026 - behind the hype there's now real revenue, real usage and real productivity.",
  },
  {
    title: 'China’s "iPhone moment"',
    body: "Chinese AI stops being the underdog. Expect a genuine breakthrough, and Western companies quietly adopting Chinese open models because they're good, cheap and open.",
  },
  {
    title: "Digital workers arrive for real",
    body: 'AI agents finally show up as "digital workers" at meaningful scale, doing real jobs in real companies. The year agent hype turns into agent payroll.',
  },
  {
    title: "In-chat buying goes mainstream in Denmark",
    body: "You'll shop without leaving the chat, buying inside ChatGPT and other assistants on the free tiers, right here in Denmark. It quietly rewires e-commerce.",
  },
  {
    title: "AI cracks a real drug-discovery milestone",
    body: "The most important one: AI delivers a genuine breakthrough, a candidate found or designed by AI that reaches a stage no human-only process would hit as fast. Where AI stops being about productivity and starts being about lives.",
  },
];

export type ArchivePrediction = {
  title: string;
  url: string | null;
  summary: string;
};

export type ArchiveYear = {
  year: string;
  intro: string;
  topLink?: { href: string; label: string };
  predictions: ArchivePrediction[];
};

/** The back catalogue - each prediction links to the full article on Medium. */
export const ARCHIVE: ArchiveYear[] = [
  {
    year: "2023",
    intro: "The ten trends I called for 2023.",
    predictions: [
      {
        title: "Goodbye Creators - Hello Algo's",
        url: "https://medium.com/predict/goodbye-creators-hello-algo-s-809848383717",
        summary:
          "Generative AI will disrupt most creative jobs, with more jaw-dropping breakthroughs still to come.",
      },
      {
        title: "Matter - the SmartHome solution we've been waiting for",
        url: "https://medium.com/predict/matter-the-smarthome-solution-weve-been-waiting-for-e1dc4dfc8880",
        summary:
          "The new Matter standard, backed by 300+ companies, finally makes smart-home devices work together and drives mainstream adoption.",
      },
      {
        title: "Meet your future Robo Butler",
        url: "https://medium.com/predict/meet-your-future-robo-butler-aa1e491497ad",
        summary:
          "Most people will meet a commercial home or service robot for the first time as consumer robotics matures.",
      },
      {
        title: "Kiss your passwords goodbye!",
        url: "https://medium.com/predict/kiss-your-passwords-goodbye-479947c93a40",
        summary:
          "Microsoft, Google and Meta roll out Passkeys, and passwordless login starts to replace the password.",
      },
      {
        title: "It's time to build your digital twin",
        url: "https://medium.com/predict/its-time-to-build-your-digital-twin-bffb3d419742",
        summary:
          "Lifelike 3D digital twins become something people build for work, collaboration and the metaverse.",
      },
      {
        title: "One step closer to AGI",
        url: "https://medium.com/predict/one-step-closer-to-agi-ca7b73465b89",
        summary:
          "Much larger models like GPT-4 deliver smoother, more human-like dialogue - another step toward AGI.",
      },
      {
        title: "The impression recession",
        url: "https://medium.com/predict/the-impression-recession-92cadbf78766",
        summary:
          "New EU regulation forces social platforms to rethink data privacy, shrinking the ad impressions they can sell.",
      },
      {
        title: "Are we ready for Bio Printing?",
        url: "https://medium.com/predict/are-we-ready-for-bioprinting-87d7f9f8e536",
        summary:
          "New commercial uses of 3D bioprinting - printing tissue from living cells - emerge, with big implications for medicine.",
      },
      {
        title: "The LiDAR Revolution",
        url: "https://medium.com/predict/the-lidar-revolution-52e888a0ce41",
        summary:
          "LiDAR becomes one of the most talked-about technologies of the year, from self-driving cars to consumer devices.",
      },
      {
        title: "Sit back and relax - autonomous driving is finally here",
        url: "https://medium.com/predict/sit-back-and-relax-14db4191ce4f",
        summary:
          "By year's end few will doubt self-driving cars are near, as Cruise, Tesla and Chinese investment drive rapid progress.",
      },
    ],
  },
  {
    year: "2022",
    intro: "The ten trends I called for 2022.",
    predictions: [
      {
        title: "Non-fungible tokens will revolutionize art",
        url: "https://arvrjourney.com/non-fungible-tokens-will-revolutionize-art-9b4a091588bd",
        summary:
          "NFTs go mainstream as a way to prove ownership of digital goods, riding Beeple's $69M Christie's sale.",
      },
      {
        title: "Metaverses in the making",
        url: "https://arvrjourney.com/metaverses-in-the-making-fc52d86c6c6c",
        summary:
          "The first commercially capable metaverses emerge; brands should start paying attention.",
      },
      {
        title: "Holoportation is now a thing",
        url: "https://medium.com/@timfrankandersen/holoportation-is-a-thing-now-3d2eca71ac7d",
        summary:
          "Real solutions let people appear as real-time holograms - foreshadowed by ABBA's 'Abbatars'.",
      },
      {
        title: "Hey there, virtual humans",
        url: "https://medium.com/predict/hey-there-virtual-humans-7eb7bc3e3477",
        summary:
          "Virtual influencers, pop stars and workers arrive, and we interact with lifelike people who don't exist.",
      },
      {
        title: "The future of food",
        url: "https://medium.com/predict/the-future-of-food-dfc151244276",
        summary:
          "Big changes begin - alternative proteins, cultured meat and more sustainable production.",
      },
      {
        title: "We're all becoming cyborgs",
        url: "https://medium.com/predict/we-re-all-becoming-cyborgs-e8052834ab23",
        summary:
          "Wearables and glasses blur the line between human and machine even further.",
      },
      {
        title: "Brain-computer interfaces",
        url: "https://medium.com/predict/brain-computer-interfaces-f1847ad82b6",
        summary:
          "BCIs gain serious attention, including the first simple FDA-approved systems.",
      },
      {
        title: "Tiny ML will move AI and IoT forward",
        url: "https://medium.com/predict/tiny-ml-will-move-ai-and-iot-forward-33d7b72cef7b",
        summary:
          "Machine learning meets edge IoT, unlocking cheap, low-energy, on-device intelligence.",
      },
      {
        title: "The revival of the website",
        url: "https://medium.com/predict/the-revival-of-the-website-9d7a8610078f",
        summary:
          "A renewed fight over customer ownership drives fresh investment in the owned website.",
      },
      {
        title: "How are your digital ethics doing?",
        url: "https://timfrankandersen.medium.com/how-are-your-digital-ethics-doing-15a7319f0249",
        summary:
          "More companies ask 'just because we can, should we?' - making responsible design a business advantage.",
      },
    ],
  },
  {
    year: "2021",
    intro: "The ten trends I called for 2021.",
    predictions: [
      {
        title: "The rise of the Games War",
        url: "https://medium.datadriveninvestor.com/the-rise-of-the-games-war-9ad8dcd0b48a",
        summary:
          "A platform war around the new PS5 and Xbox Series X, fought over exclusives and all-you-can-play subscriptions.",
      },
      {
        title: "Please don't touch!",
        url: "https://timfrankandersen.medium.com/please-dont-touch-acceec1a65c",
        summary:
          "Contactless tech - NFC, face recognition, gesture control - has a breakout year as the pandemic drives demand.",
      },
      {
        title: "Everything as a service",
        url: "https://timfrankandersen.medium.com/everything-as-a-service-ada1c6dcdb3",
        summary:
          "Subscription 'as-a-service' models dominate across entertainment, fitness, shopping and software.",
      },
      {
        title: "Hybrid is the new black",
        url: "https://timfrankandersen.medium.com/hybrid-is-the-new-black-5b03b45f14f8",
        summary:
          "Hybrid work and events become the norm, driving demand for far better remote-collaboration tech.",
      },
      {
        title: "National controlled digital currencies",
        url: "https://medium.com/thedarkside/national-controlled-digital-currencies-c8e5918ffbbc",
        summary:
          "The first major central-bank digital currency roll-outs, spurred by China's digital yuan.",
      },
      {
        title: "Goodbye to the physical wallet",
        url: "https://timfrankandersen.medium.com/goodbye-to-the-physical-wallet-46dc2dd7dc58",
        summary:
          "Cards, IDs and cash move into phones and watches via NFC and biometrics - the phone becomes the wallet.",
      },
      {
        title: "A new health paradigm",
        url: "https://timfrankandersen.medium.com/a-new-health-paradigm-552ff125dfd7",
        summary:
          "A data-driven, AI-supported shift toward home-care and self-care, with wearables and remote diagnosis.",
      },
      {
        title: "The future of wireless technologies",
        url: "https://timfrankandersen.medium.com/the-future-of-wireless-technologies-6ffc78fc6bb8",
        summary:
          "Bluetooth 5.2 and Ultra-Wideband enable faster, low-energy connection and centimeter-level location tracking.",
      },
      {
        title: "TV shopping on steroids: live-streaming e-commerce",
        url: "https://timfrankandersen.medium.com/tv-shopping-on-steroids-live-streaming-e-commerce-f38c9b0b0dc",
        summary:
          "Live-stream shopping - already huge in China - breaks into the Western market.",
      },
      {
        title: "The year of AR glasses?",
        url: "https://arvrjourney.com/2021-the-year-of-ar-glasses-12eeb25b0aa6",
        summary:
          "My big bet on AR glasses as the next computing platform, hoping Apple would reveal its Glasses.",
      },
    ],
  },
  {
    year: "2020",
    intro:
      "My very first list - ten predictions for 2020, published as one piece.",
    topLink: {
      href: "https://medium.com/the-capital/2020-the-digital-crossroad-644b4e48d3c9",
      label: "Read the full 2020 predictions on Medium",
    },
    predictions: [
      {
        title: "The digital sustainability paradox",
        url: null,
        summary:
          "The debate around digital sustainability and the UN's 17 goals intensifies, forcing companies to take a stand.",
      },
      {
        title: "In tech we trust?",
        url: null,
        summary:
          "Trust, ethics and control over powerful tech like AI and gene-editing rise to the top of the agenda.",
      },
      {
        title: "Computer vision and face recognition",
        url: null,
        summary:
          "Vision and face recognition go mainstream - pay with a smile - alongside a growing surveillance debate.",
      },
      {
        title: "CRISPR coming of age",
        url: null,
        summary:
          "Major commercial breakthroughs in CRISPR gene-editing move toward tackling genetic disease.",
      },
      {
        title: "The maturity of additive manufacturing",
        url: null,
        summary:
          "3D printing matures from prototyping into scalable production of end-use parts.",
      },
      {
        title: "Generative design",
        url: null,
        summary:
          "AI-driven generative design breaks through, working hand-in-hand with 3D printing.",
      },
      {
        title: "The dawn for drone delivery",
        url: null,
        summary:
          "Wider real-world drone delivery as the technology and regulation catch up.",
      },
      {
        title: "The end of banks as we know them",
        url: null,
        summary:
          "Challenger banks and fintech start-ups shift the balance of power in finance.",
      },
      {
        title: "Cryptocurrency comeback",
        url: null,
        summary:
          "A resurgence of crypto, with renewed mainstream and institutional interest.",
      },
      {
        title: "Quantum supremacy",
        url: null,
        summary:
          "The first real demonstrations of quantum computing power far beyond classical machines.",
      },
    ],
  },
];
