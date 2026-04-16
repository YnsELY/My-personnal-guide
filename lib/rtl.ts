import { I18nManager } from 'react-native';
import type { FlexStyle, TextStyle, ViewStyle } from 'react-native';

export const isRTL = () => I18nManager.isRTL;

export const flexRow = (rtl = I18nManager.isRTL): FlexStyle['flexDirection'] =>
  rtl ? 'row-reverse' : 'row';

export const flexRowReverse = (rtl = I18nManager.isRTL): FlexStyle['flexDirection'] =>
  rtl ? 'row' : 'row-reverse';

export const rowStyle = (rtl = I18nManager.isRTL): Pick<ViewStyle, 'flexDirection'> => ({
  flexDirection: flexRow(rtl),
});

export const rowReverseStyle = (rtl = I18nManager.isRTL): Pick<ViewStyle, 'flexDirection'> => ({
  flexDirection: flexRowReverse(rtl),
});

export const directionStyle = (rtl = I18nManager.isRTL): Pick<ViewStyle, 'direction'> => ({
  direction: rtl ? 'rtl' : 'ltr',
});

export const textAlign = (rtl = I18nManager.isRTL): TextStyle['textAlign'] =>
  rtl ? 'right' : 'left';

export const textAlignEnd = (rtl = I18nManager.isRTL): TextStyle['textAlign'] =>
  rtl ? 'left' : 'right';

export const textStart = (rtl = I18nManager.isRTL): Pick<TextStyle, 'textAlign' | 'writingDirection'> => ({
  textAlign: textAlign(rtl),
  writingDirection: rtl ? 'rtl' : 'ltr',
});

export const textEnd = (rtl = I18nManager.isRTL): Pick<TextStyle, 'textAlign' | 'writingDirection'> => ({
  textAlign: textAlignEnd(rtl),
  writingDirection: rtl ? 'rtl' : 'ltr',
});

export const forceLTRText = (): Pick<TextStyle, 'textAlign' | 'writingDirection'> => ({
  textAlign: 'left',
  writingDirection: 'ltr',
});

export const flipStyle = (rtl = I18nManager.isRTL) =>
  rtl ? { transform: [{ scaleX: -1 }] } : {};

export const flipChevron = (rtl = I18nManager.isRTL) => flipStyle(rtl);

export const marginStart = (value: number, rtl = I18nManager.isRTL): FlexStyle =>
  rtl ? { marginRight: value } : { marginLeft: value };

export const marginEnd = (value: number, rtl = I18nManager.isRTL): FlexStyle =>
  rtl ? { marginLeft: value } : { marginRight: value };

export const paddingStart = (value: number, rtl = I18nManager.isRTL): FlexStyle =>
  rtl ? { paddingRight: value } : { paddingLeft: value };

export const paddingEnd = (value: number, rtl = I18nManager.isRTL): FlexStyle =>
  rtl ? { paddingLeft: value } : { paddingRight: value };

export const startSpacing = (value: number, rtl = I18nManager.isRTL): FlexStyle =>
  marginStart(value, rtl);

export const endSpacing = (value: number, rtl = I18nManager.isRTL): FlexStyle =>
  marginEnd(value, rtl);

export const absoluteStart = (value: number, rtl = I18nManager.isRTL): ViewStyle =>
  rtl ? { right: value } : { left: value };

export const absoluteEnd = (value: number, rtl = I18nManager.isRTL): ViewStyle =>
  rtl ? { left: value } : { right: value };
