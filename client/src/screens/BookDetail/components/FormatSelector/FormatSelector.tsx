import { Text } from '@livre/primitives';
import { type BookFormat } from '@livre/types';
import { FormatRow, FormatSelectorWrap, FormatOpt } from './FormatSelector.styles';
import { PhysicalIcon, EreaderIcon, AudioIcon } from '../FormatIcons';

interface FormatSelectorProps {
  value: BookFormat | null;
  onChange: (format: BookFormat) => void;
}

/**
 * Three-button toggle for selecting the reading format (Physical, E-reader, Audio). Appears in
 * the hero section when the book is actively being read. Format changes are stored as their own
 * log event type so the full per-cycle format history is preserved.
 */
export const FormatSelector = ({ value, onChange }: FormatSelectorProps) => (
  <FormatRow>
    <Text variant="label" color="muted">
      Format
    </Text>
    <FormatSelectorWrap>
      <FormatOpt $active={value === 'physical'} type="button" onClick={() => onChange('physical')}>
        <PhysicalIcon />
        <Text variant="ui-tight">Physical</Text>
      </FormatOpt>
      <FormatOpt $active={value === 'ereader'} type="button" onClick={() => onChange('ereader')}>
        <EreaderIcon />
        <Text variant="ui-tight">E-reader</Text>
      </FormatOpt>
      <FormatOpt $active={value === 'audio'} type="button" onClick={() => onChange('audio')}>
        <AudioIcon />
        <Text variant="ui-tight">Audio</Text>
      </FormatOpt>
    </FormatSelectorWrap>
  </FormatRow>
);
