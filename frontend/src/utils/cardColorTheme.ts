import { CARD_COLORS } from '@/types/finance';

export interface CardColorTheme {
  gradient: string;
  toggleTrack: string;
  toggleItem: string;
  toggleItemActive: string;
  summaryBar: string;
  summaryAccent: string;
}

const CARD_COLOR_THEMES: Record<string, CardColorTheme> = {
  violet: {
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    toggleTrack: 'bg-violet-500/10',
    toggleItem:
      'text-violet-700 hover:bg-violet-500/15 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-violet-500 data-[state=on]:to-purple-600 data-[state=on]:text-white',
    summaryBar: 'bg-violet-500/15',
    summaryAccent: 'text-violet-700 dark:text-violet-400',
  },
  orange: {
    gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
    toggleTrack: 'bg-orange-500/10',
    toggleItem:
      'text-orange-700 hover:bg-orange-500/15 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-orange-500 data-[state=on]:to-red-500 data-[state=on]:text-white',
    summaryBar: 'bg-orange-500/15',
    summaryAccent: 'text-orange-700 dark:text-orange-400',
  },
  emerald: {
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    toggleTrack: 'bg-emerald-500/10',
    toggleItem:
      'text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-emerald-500 data-[state=on]:to-teal-600 data-[state=on]:text-white',
    summaryBar: 'bg-emerald-500/15',
    summaryAccent: 'text-emerald-700 dark:text-emerald-400',
  },
  blue: {
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    toggleTrack: 'bg-blue-500/10',
    toggleItem:
      'text-blue-700 hover:bg-blue-500/15 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-blue-500 data-[state=on]:to-indigo-600 data-[state=on]:text-white',
    summaryBar: 'bg-blue-500/15',
    summaryAccent: 'text-blue-700 dark:text-blue-400',
  },
  pink: {
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',
    toggleTrack: 'bg-pink-500/10',
    toggleItem:
      'text-pink-700 hover:bg-pink-500/15 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-pink-500 data-[state=on]:to-rose-600 data-[state=on]:text-white',
    summaryBar: 'bg-pink-500/15',
    summaryAccent: 'text-pink-700 dark:text-pink-400',
  },
  yellow: {
    gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    toggleTrack: 'bg-amber-400/15',
    toggleItem:
      'text-amber-700 hover:bg-amber-400/20 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-yellow-400 data-[state=on]:to-amber-500 data-[state=on]:text-white',
    summaryBar: 'bg-amber-400/15',
    summaryAccent: 'text-amber-700 dark:text-amber-400',
  },
  slate: {
    gradient: 'bg-gradient-to-br from-slate-600 to-slate-800',
    toggleTrack: 'bg-slate-500/10',
    toggleItem:
      'text-slate-700 hover:bg-slate-500/15 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-slate-600 data-[state=on]:to-slate-800 data-[state=on]:text-white',
    summaryBar: 'bg-slate-500/15',
    summaryAccent: 'text-slate-700 dark:text-slate-400',
  },
  cyan: {
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    toggleTrack: 'bg-cyan-500/10',
    toggleItem:
      'text-cyan-700 hover:bg-cyan-500/15 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-cyan-500 data-[state=on]:to-blue-500 data-[state=on]:text-white',
    summaryBar: 'bg-cyan-500/15',
    summaryAccent: 'text-cyan-700 dark:text-cyan-400',
  },
  red: {
    gradient: 'bg-gradient-to-br from-red-500 to-rose-600',
    toggleTrack: 'bg-red-500/10',
    toggleItem:
      'text-red-700 hover:bg-red-500/15 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
    toggleItemActive:
      'data-[state=on]:bg-gradient-to-br data-[state=on]:from-red-500 data-[state=on]:to-rose-600 data-[state=on]:text-white',
    summaryBar: 'bg-red-500/15',
    summaryAccent: 'text-red-700 dark:text-red-400',
  },
};

export function getCardColorTheme(colorId: string): CardColorTheme {
  return CARD_COLOR_THEMES[colorId] ?? CARD_COLOR_THEMES[CARD_COLORS[0].id];
}

/** Classe de gradiente usada nos chips (from-x to-y). */
export function getCardGradientClass(colorId: string): string {
  return CARD_COLORS.find((c) => c.id === colorId)?.class ?? CARD_COLORS[0].class;
}
