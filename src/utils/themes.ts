/**
 * Theme registry — defines all available themes with metadata.
 */

export interface ThemeInfo {
  id: string;
  name: string;
  mode: 'light' | 'dark';
}

export const lightThemes: ThemeInfo[] = [
  { id: 'cadmium-light',    name: 'Cadmium Light',    mode: 'light' },
  { id: 'ayu-light',        name: 'Ayu Light',        mode: 'light' },
  { id: 'catppuccin-latte',  name: 'Catppuccin Latte',  mode: 'light' },
  { id: 'everforest-light',  name: 'Everforest Light',  mode: 'light' },
  { id: 'graphite',         name: 'Graphite Light',   mode: 'light' },
  { id: 'gruvbox-light',    name: 'Gruvbox Light',    mode: 'light' },
  { id: 'rose-pine-dawn',   name: 'Rosé Pine Dawn',    mode: 'light' },
  { id: 'solarized-light',  name: 'Solarized Light',  mode: 'light' },
  { id: 'tokyo-night-light', name: 'Tokyo Night Light', mode: 'light' },
  { id: 'ulysses',          name: 'Ulysses Light',    mode: 'light' },
];

export const darkThemes: ThemeInfo[] = [
  { id: 'cadmium-dark',      name: 'Cadmium Dark',      mode: 'dark' },
  { id: 'ayu-dark',          name: 'Ayu Dark',          mode: 'dark' },
  { id: 'ayu-mirage',        name: 'Ayu Mirage',        mode: 'dark' },
  { id: 'catppuccin-mocha',  name: 'Catppuccin Mocha',  mode: 'dark' },
  { id: 'cyberdream',        name: 'Cyberdream',        mode: 'dark' },
  { id: 'dark',              name: 'Dark',              mode: 'dark' },
  { id: 'dracula',           name: 'Dracula',           mode: 'dark' },
  { id: 'everforest-dark',   name: 'Everforest Dark',   mode: 'dark' },
  { id: 'gruvbox-dark',      name: 'Gruvbox Dark',      mode: 'dark' },
  { id: 'horizon-dark',      name: 'Horizon Dark',      mode: 'dark' },
  { id: 'kanagawa',          name: 'Kanagawa',          mode: 'dark' },
  { id: 'material-dark',     name: 'Material Dark',     mode: 'dark' },
  { id: 'monokai-pro',       name: 'Monokai Pro',       mode: 'dark' },
  { id: 'nightfox',          name: 'Nightfox',          mode: 'dark' },
  { id: 'nord',              name: 'Nord',              mode: 'dark' },
  { id: 'one-dark',          name: 'One Dark',          mode: 'dark' },
  { id: 'oxocarbon-dark',    name: 'Oxocarbon Dark',    mode: 'dark' },
  { id: 'palenight',         name: 'Pale Night',        mode: 'dark' },
  { id: 'rose-pine',         name: 'Rosé Pine',          mode: 'dark' },
  { id: 'rose-pine-moon',    name: 'Rosé Pine Moon',     mode: 'dark' },
  { id: 'solarized-dark',    name: 'Solarized Dark',    mode: 'dark' },
  { id: 'synthwave-84',      name: 'SynthWave 84',      mode: 'dark' },
  { id: 'tokyo-night',       name: 'Tokyo Night',       mode: 'dark' },
  { id: 'tokyo-night-storm', name: 'Tokyo Night Storm', mode: 'dark' },
];

export const allThemes: ThemeInfo[] = [...lightThemes, ...darkThemes];

/** Look up theme info by id */
export function getThemeById(id: string): ThemeInfo | undefined {
  return allThemes.find(t => t.id === id);
}

/** Get the resolved theme mode for a given theme setting value */
export function getResolvedThemeMode(
  themeSetting: string
): 'light' | 'dark' {
  if (themeSetting === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  const info = getThemeById(themeSetting);
  return info?.mode ?? 'light';
}
