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
      setSettings(await apiService.getAppSettings());
    } catch (_e) {
      // keep the standard settings
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <AppSettingsContext.Provider value={{ settings, loaded, reload, setSettings }}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => useContext(AppSettingsContext);
