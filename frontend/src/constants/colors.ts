/** Paleta de cores do app Next-Calendar */
export const Colors = {
  /** Dourado — cor primária do app */
  gold: '#D9B76A',
  goldLight: '#F0D9A0',
  goldDark: '#B89A4A',

  /** Fundo e texto */
  dark: '#0D0D12',
  white: '#FFFFFF',

  /** Cinzas */
  grey100: '#DFE1E7',
  grey200: '#C8CAD2',
  grey400: '#818898',
  grey500: '#60646C',
  grey700: '#3A3D47',

  /** Estados */
  success: '#2DC653',
  error: '#E84040',

  /** Superfícies */
  surface: '#F7F8FA',
} as const;

export type AppColor = keyof typeof Colors;
