import { type ReactNode } from 'react';
import { Text } from '@livre/primitives';
import { SectionRoot, SectionHeader, SectionHeading } from './Settings.styles';

interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

/**
 * The frame every settings tab shares: an h3 title, an optional supporting description, and a
 * vertical stack of content blocks. Centralising it here means the title-to-body and block-to-block
 * rhythm is defined once instead of each tab spacing its own fragment siblings, which is what let
 * the tabs drift apart. The optional `action` renders a control aligned to the header's trailing
 * edge for tabs that need a section-level affordance (e.g. Users' "Add user").
 */
export const Section = (props: SectionProps) => {
  const { title, description, action, children } = props;

  return (
    <SectionRoot>
      <SectionHeader>
        <SectionHeading>
          <Text variant="h3" as="h2">
            {title}
          </Text>
          {description && (
            <Text variant="ui-sm" color="muted">
              {description}
            </Text>
          )}
        </SectionHeading>
        {action}
      </SectionHeader>
      {children}
    </SectionRoot>
  );
};

export type { SectionProps };
