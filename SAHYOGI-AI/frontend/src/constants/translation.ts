import { Language } from "../context/LanguageContext";

export const translations: Record<
  Language,
  {
    dashboard: string;
    weather: string;
    voice: string;
    sell: string;
    market: string;
    schemes: string;
    soil: string;
    pest: string;
  }
> = {
  en: {
    dashboard: "Dashboard",
    weather: "Weather Forecast",
    voice: "Voice Assistant",
    sell: "Sell Simulation",
    market: "Market Prices",
    schemes: "Government Schemes",
    soil: "Soil Analysis",
    pest: "Pest Detection",
  },

  hi: {
    dashboard: "डैशबोर्ड",
    weather: "मौसम पूर्वानुमान",
    voice: "वॉइस असिस्टेंट",
    sell: "बिक्री सिमुलेशन",
    market: "बाजार मूल्य",
    schemes: "सरकारी योजनाएं",
    soil: "मृदा विश्लेषण",
    pest: "कीट पहचान",
  },

  od: {
    dashboard: "ଡ୍ୟାଶବୋର୍ଡ",
    weather: "ଆବହା ପୂର୍ବାନୁମାନ",
    voice: "ଭୋଇସ୍ ସହାୟକ",
    sell: "ବିକ୍ରୟ ସିମ୍ୟୁଲେସନ",
    market: "ବଜାର ଦର",
    schemes: "ସରକାରୀ ଯୋଜନା",
    soil: "ମାଟି ବିଶ୍ଳେଷଣ",
    pest: "କୀଟ ଚିହ୍ନଟ",
  },
};