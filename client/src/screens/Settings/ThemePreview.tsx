import { ThemeProvider } from 'styled-components';
import { themes, type ThemeName } from '@livre/ui';
import { Frame, Rail, RailDot, Side, Bar, BarStub, Canvas, Spine } from './ThemePreview.styles';

interface ThemePreviewProps {
  theme: ThemeName;
}

/**
 * Miniature wireframe of the app — nav rail, header, and book spines — rendered in a given theme's
 * tokens so readers can preview a palette before applying it. Scopes the tokens with a bare
 * styled-components ThemeProvider rather than LivreThemeProvider, which would re-inject the global
 * stylesheet; only the local token swap is wanted here.
 */
export const ThemePreview = ({ theme }: ThemePreviewProps) => (
  <ThemeProvider theme={themes[theme].tokens}>
    <Frame>
      <Rail>
        <RailDot $accent />
        <RailDot />
        <RailDot />
      </Rail>
      <Side>
        <Bar>
          <BarStub />
        </Bar>
        <Canvas>
          <Spine />
          <Spine />
          <Spine />
        </Canvas>
      </Side>
    </Frame>
  </ThemeProvider>
);
