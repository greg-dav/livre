import { useState, useEffect, useRef } from 'react';
import { Pill, Text } from '@livre/primitives';
import { TagRow, RemoveButton, AddPill, AddSizer, AddInput } from './TagList.styles';

interface TagListProps {
  tags: string[];
  editable?: boolean;
  onChange?: (tags: string[]) => void;
}

/**
 * Renders book tags as pills. In editable mode a remove button sits inside each pill
 * (always visible, not hover-revealed) and a ghost "+ Add tag" control appears at the end.
 * Manages local tag state seeded from props; wire onChange to persist changes upstream.
 */
export const TagList = ({ tags: initialTags, editable = false, onChange }: TagListProps) => {
  const [tags, setTags] = useState(initialTags);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const remove = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    onChange?.(next);
  };

  const commit = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const next = [...tags, trimmed];
      setTags(next);
      onChange?.(next);
    }
    setInput('');
    setAdding(false);
  };

  if (tags.length === 0 && !editable) return null;

  return (
    <TagRow>
      {tags.map((tag) => (
        <Pill key={tag}>
          <Text variant="ui-sm" color="muted">
            {tag}
          </Text>
          {editable && (
            <RemoveButton onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
              <Text variant="ui-sm" color="muted">
                ×
              </Text>
            </RemoveButton>
          )}
        </Pill>
      ))}
      {editable &&
        (adding ? (
          <Text variant="ui-sm">
            <AddSizer data-value={input || 'Add tag…'}>
              <AddInput
                ref={inputRef}
                size={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === 'Escape') {
                    setInput('');
                    setAdding(false);
                  }
                }}
                onBlur={commit}
                placeholder="Add tag…"
              />
            </AddSizer>
          </Text>
        ) : (
          <AddPill onClick={() => setAdding(true)}>
            <Text variant="ui-sm" color="muted">
              + Add tag
            </Text>
          </AddPill>
        ))}
    </TagRow>
  );
};
