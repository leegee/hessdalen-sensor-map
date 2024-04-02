import React, { useState, useEffect } from 'react';
import { init } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';

import config from '@hessdalen-sensor-map/config/src';
import { RootState } from './redux/store';
import { setLocaleKey } from './redux/guiSlice';

import './LocaleManager.css';

export const translations: Record<string, Promise<any>> = {
    'en': import('./locales/en.json'),
    'no': import('./locales/no.json'),
};

type LocaleKey = keyof typeof translations;

export const setupLocale = async (locale?: LocaleKey): Promise<void> => {
    locale = locale ?? config.locale;
    await loadLocale(locale);
};

export const getTranslation = async (locale: LocaleKey) => {
    const translation = await translations[locale] as Record<string, any>;
    return translation;
};

export const loadLocale = async (locale: LocaleKey): Promise<void> => {
    const translation = await getTranslation(locale);
    await init({
        currentLocale: locale,
        locales: { [locale]: translation },
    });
};

const LocaleManager = () => {
    const dispatch = useDispatch();
    const { locale } = useSelector((state: RootState) => state.gui);

    const [loading, setLoading] = useState(true);

    function handleClick(newLocale: LocaleKey) {
        setLoading(true);
        try {
            void loadLocale(newLocale).then(() => {
                dispatch(setLocaleKey(newLocale));
                setLoading(false);
            });
        } catch (err) {
            console.error('Failed to load translations');
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        loadLocale(locale)
            .then(() => setLoading(false))
            .catch(() => {
                console.error('Failed to load translations');
                setLoading(false);
            });
    }, [locale]);

    return (
        <nav>
            {locale ? (
                <>
                    {locale === 'no' ? (
                        <button disabled={loading} className='map-ctrl locale-ctrl' onClick={() => handleClick('en')}>🇬🇧</button>
                    ) : (
                        <button disabled={loading} className='map-ctrl locale-ctrl' onClick={() => handleClick('no')}>🇳🇴</button>
                    )}
                </>
            ) : (
                <span>Locale not available</span>
            )}
        </nav>
    );
};

export default LocaleManager;
