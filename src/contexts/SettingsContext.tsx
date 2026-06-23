import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loadSettings, saveSettings, type AppSettings, DEFAULT_SETTINGS } from '../utils/settings';
import { setZoomLevel } from '../utils/webview';
import LoadingSplash from '../components/LoadingSplash';

interface SettingsContextValue {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        loadSettings().then((loadedSettings) => {
            if (cancelled) return;
            setSettings(loadedSettings);
            setZoomLevel(loadedSettings.zoomLevel);
            setLoaded(true);
        }).catch((err) => {
            console.error('Failed to load settings:', err);
            setLoaded(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const updateSettings = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        await saveSettings(newSettings);
    };

    if (!loaded) return <LoadingSplash />;

    return (
        <SettingsContext.Provider value={{ settings, setSettings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
