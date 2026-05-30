import { Icon, Text } from '@livre/primitives';
import { themes, type ThemeName } from '@livre/ui';
import { useTheme } from '../../context/ThemeContext';
import { ThemePreview } from './ThemePreview';
import { SectionHead, Block } from './Settings.styles';
import { ThemeGrid, ThemeOption, ThemeOptionFooter } from './AppearanceSection.styles';

const THEME_NAMES = Object.keys(themes) as ThemeName[];

/**
 * Appearance settings. The theme is chosen from a gallery of live wireframe previews rather than a
 * toggle, so the full palette is visible before it's applied. Selecting one persists immediately
 * via the theme context — there's no separate save step.
 */
export const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SectionHead>
        <Text variant="h3" as="h2">
          Appearance
        </Text>
        <Text variant="ui-sm" color="muted">
          Choose the palette Livre wears. Your choice follows your account across devices.
        </Text>
      </SectionHead>
      <Block>
        <Text variant="label" color="accent">
          Theme
        </Text>
        <ThemeGrid>
          {THEME_NAMES.map((name) => {
            const active = theme === name;
            return (
              <ThemeOption
                key={name}
                $active={active}
                onClick={() => setTheme(name)}
                aria-pressed={active}
              >
                <ThemePreview theme={name} />
                <ThemeOptionFooter>
                  <Text variant="ui-sm" color={active ? 'accent' : 'default'}>
                    {themes[name].label}
                  </Text>
                  {active && <Icon icon="check" size={16} />}
                </ThemeOptionFooter>
              </ThemeOption>
            );
          })}
        </ThemeGrid>
      </Block>
    </>
  );
};
