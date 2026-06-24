import { useSettingsStore } from '../store/settingsStore';
import { translations } from './translations';

export const useTranslation = () => {
  const langue = useSettingsStore(state => state.langue);

  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[langue];

    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // Fallback to FR if key not found in current language
        let fallback = translations['fr'];
        for (const fk of keys) {
            if (fallback && fallback[fk]) {
                fallback = fallback[fk];
            } else {
                return key;
            }
        }
        return fallback;
      }
    }

    return result;
  };

  return { t, langue };
};
