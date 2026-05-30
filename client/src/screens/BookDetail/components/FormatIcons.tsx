import React from 'react';
import { Icon } from '@livre/primitives';

interface IconProps {
  width?: number;
  height?: number;
}

const DEFAULT_SIZE = 15;

// Legacy width/height props are preserved for call sites; the Icon primitive renders square, so
// the larger dimension wins.
const size = ({ width, height }: IconProps) => Math.max(width ?? 0, height ?? 0) || DEFAULT_SIZE;

export const PhysicalIcon = (props: IconProps) => <Icon icon="book" size={size(props)} />;

export const EreaderIcon = (props: IconProps) => <Icon icon="tablet" size={size(props)} />;

export const AudioIcon = (props: IconProps) => <Icon icon="headphones" size={size(props)} />;

export type FormatIconComponent = (props: IconProps) => React.JSX.Element;

export const FORMAT_ICONS: Record<string, FormatIconComponent> = {
  physical: PhysicalIcon,
  ereader: EreaderIcon,
  audio: AudioIcon,
};
