import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import EN from '../../Languages/EN.json';
import ISV from '../../Languages/ISV.json';
import RU from '../../Languages/RU.json';
import UA from '../../Languages/UA.json';
import BY from '../../Languages/BY.json';
import PL from '../../Languages/PL.json';
import KZ from '../../Languages/KZ.json';
import TR from '../../Languages/TR.json';
import BG from '../../Languages/BG.json';
import DE from '../../Languages/DE.json';
import JA from '../../Languages/JA.json';
import ZH from '../../Languages/ZH.json';
import YI from '../../Languages/YI.json';

const resources = {
  en: { translation: EN },
  isv: { translation: ISV },
  ru: { translation: RU },
  ua: { translation: UA },
  by: { translation: BY },
  pl: { translation: PL },
  kz: { translation: KZ },
  tr: { translation: TR },
  bg: { translation: BG },
  de: { translation: DE },
  ja: { translation: JA },
  zh: { translation: ZH },
  yi: { translation: YI }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;