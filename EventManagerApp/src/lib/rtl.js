import { I18nManager } from 'react-native';

// This file must be imported before any screen or navigation file so that
// I18nManager.isRTL is already true when those module bodies evaluate
// their top-level `const rtl = I18nManager.isRTL` constants.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
