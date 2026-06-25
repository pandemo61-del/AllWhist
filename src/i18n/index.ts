import { useSettingsStore } from '../store/settingsStore';
import { translations } from './translations';

export const useTranslation = () => {
  const langue = useSettingsStore(state => state.langue);

  const t = (key: string): any => {
    const keys = key.split('.');

    // 1. Essayer la langue actuelle
    let current: any = translations[langue];
    let found = true;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        found = false;
        break;
      }
    }
    if (found) return current;

    // 2. Fallback sur le Français
    if (langue !== 'fr') {
      let fallback: any = translations['fr'];
      let fallbackFound = true;
      for (const k of keys) {
        if (fallback && fallback[k] !== undefined) {
          fallback = fallback[k];
        } else {
          fallbackFound = false;
          break;
        }
      }
      if (fallbackFound) return fallback;
    }

    // 3. Retourner la clé si rien n'est trouvé
    return key;
  };

  return { t, langue };
};
