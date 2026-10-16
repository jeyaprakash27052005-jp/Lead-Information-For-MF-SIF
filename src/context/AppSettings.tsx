import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS } from '../utils/appSettings';
import { apiService } from '../services/api';

interface Ctx {
  settings: AppSettings;
  loaded: boolean;
  reload: () => Promise<void>;
  setSettings: (s: AppSettings) => void;
}

const AppSettingsContext = createContext<Ctx>({
  settings: DEFAULT_APP_SETTINGS,
  loaded: false,
  reload: async () => undefined,
  setSettings: () => undefined,
});

/** Loads the on/off switches and calculator rates the Head / Regional Incharge set in the admin portal */
export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const fresh: AppSettings = await apiService.getAppSettings();
      // only replace when something changed, so screens do not flicker
      setSettings((old) => (JSON.stringify(old) === JSON.stringify(fresh) ? old : fresh));
    } catch (_e) {
      // keep the standard settings
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
    // Pick up switches the Head / Regional Incharge changed, without anyone refreshing the page
    const timer = setInterval(reload, 20000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return <AppSettingsContext.Provider value={{ settings, loaded, reload, setSettings }}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => useContext(AppSettingsContext);
