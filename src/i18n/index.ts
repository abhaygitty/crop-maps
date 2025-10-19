import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./translations/en.json";
import kn from "./translations/kn.json";
import hi from "./translations/hi.json";

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    kn: { translation: kn }
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode || "en";

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: deviceLanguage,
        fallbackLng: "en",
        interpolation: { escapeValue: false }
    });

export default i18n;