import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
}

export const PhysicalIcon = ({ width = 13, height = 10 }: IconProps) => (
  <svg width={width} height={height} viewBox="0 0 13 10" fill="none">
    <path d="M6.5 0.5V9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <path
      d="M6.5 0.5H1.5C1.2 0.5 1 0.7 1 1V9C1 9.3 1.2 9.5 1.5 9.5H6.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 0.5H11.5C11.8 0.5 12 0.7 12 1V9C12 9.3 11.8 9.5 11.5 9.5H6.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
);

export const EreaderIcon = ({ width = 9, height = 12 }: IconProps) => (
  <svg width={width} height={height} viewBox="0 0 9 12" fill="none">
    <rect
      x="0.75"
      y="0.75"
      width="7.5"
      height="10.5"
      rx="1.25"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <circle cx="4.5" cy="9.5" r="0.7" fill="currentColor" />
  </svg>
);

export const AudioIcon = ({ width = 13, height = 11 }: IconProps) => (
  <svg width={width} height={height} viewBox="0 0 13 11" fill="none">
    <path
      d="M2 5.5V5a4.5 4.5 0 0 1 9 0v.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <rect
      x="0.75"
      y="5.5"
      width="2.5"
      height="4"
      rx="0.75"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <rect
      x="9.75"
      y="5.5"
      width="2.5"
      height="4"
      rx="0.75"
      stroke="currentColor"
      strokeWidth="1.25"
    />
  </svg>
);

export type FormatIconComponent = (props: IconProps) => React.JSX.Element;

export const FORMAT_ICONS: Record<string, FormatIconComponent> = {
  physical: PhysicalIcon,
  ereader: EreaderIcon,
  audio: AudioIcon,
};
