export type ThemeTokens = {
  background: string;
  border: string;
  card: string;
  danger: string;
  elevatedPurple: string;
  input: string;
  inputPurple: string;
  overlay: string;
  placeholder: string;
  primary: string;
  primaryContrast: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  soft: string;
  success: string;
  successSoft: string;
  surface: string;
  surfacePurple: string;
  surfaceRaised: string;
  tabBar: string;
  text: string;
  textMuted: string;
  warning: string;
  warningSoft: string;
};

const darkSurfacePurple = '#3b304a';
const darkElevatedPurple = '#47395a';
const darkInputPurple = '#342a42';

export const lightTheme: ThemeTokens = {
  background: '#fffefb',
  border: '#ece8e3',
  card: '#ffffff',
  danger: '#c94b4b',
  elevatedPurple: '#f0ebf7',
  input: '#ffffff',
  inputPurple: '#ffffff',
  overlay: 'rgba(35, 27, 39, 0.52)',
  placeholder: '#8c8782',
  primary: '#e45336',
  primaryContrast: '#ffffff',
  primarySoft: '#fff0ec',
  secondary: '#614193',
  secondarySoft: '#f0ebf7',
  soft: '#f9f9e2',
  success: '#32966f',
  successSoft: '#e7f5ef',
  surface: '#ffffff',
  surfacePurple: '#f0ebf7',
  surfaceRaised: '#ffffff',
  tabBar: '#ffffff',
  text: '#333333',
  textMuted: '#77736f',
  warning: '#e3a328',
  warningSoft: '#fff6dc',
};

export const darkTheme: ThemeTokens = {
  background: '#1f1b24',
  border: '#675a73',
  card: darkSurfacePurple,
  danger: '#ff8d8d',
  elevatedPurple: darkElevatedPurple,
  input: darkInputPurple,
  inputPurple: darkInputPurple,
  overlay: 'rgba(8, 6, 10, 0.68)',
  placeholder: '#b8aec2',
  primary: '#ff795f',
  primaryContrast: '#2a1721',
  primarySoft: '#532f45',
  secondary: '#d2b7f5',
  secondarySoft: darkSurfacePurple,
  soft: darkInputPurple,
  success: '#71d5aa',
  successSoft: '#25483d',
  surface: darkSurfacePurple,
  surfacePurple: darkSurfacePurple,
  surfaceRaised: darkElevatedPurple,
  tabBar: '#30263a',
  text: '#fbf8fc',
  textMuted: '#d3cadb',
  warning: '#f5c45d',
  warningSoft: '#4b3c24',
};
