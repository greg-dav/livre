import { useState, useEffect, useRef } from 'react';
import { Pill, Text } from '@livre/primitives';
import { TagRow, RemoveButton, AddPill, AddSizer, AddGhost, AddInput } from './TagList.styles';

interface TagListProps {
  tags: string[];
  editable?: boolean;
  onChange?: (tags: string[]) => void;
  suggestions?: string[];
}

/**
 * Renders book tags as pills. In editable mode a remove button sits inside each pill
 * (always visible, not hover-revealed) and a ghost "+ Add tag" control appears at the end.
 * Typing into the add control inline-completes against `suggestions` (the user's existing tags):
 * the top prefix match is ghosted after the cursor and Tab accepts it. Manages local tag state
 * seeded from props; wire onChange to persist changes upstream.
 */
export const TagList = ({
  tags: initialTags,
  editable = false,
  onChange,
  suggestions = [],
}: TagListProps) => {
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

  // First existing tag the input is a prefix of, excluding tags already applied. The portion
  // after the typed text is the inline completion Tab accepts.
  const lower = input.trim().toLowerCase();
  const match =
    lower === ''
      ? null
      : (suggestions.find(
          (s) => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower && !tags.includes(s)
        ) ?? null);

  const commit = (value: string = input, keepOpen = false) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const next = [...tags, trimmed];
      setTags(next);
      onChange?.(next);
    }
    setInput('');
    if (!keepOpen) setAdding(false);
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
            <AddSizer data-value={match || input || 'Add tag…'}>
              {match && (
                <AddGhost aria-hidden>
                  <span>{input}</span>
                  {match.slice(input.length)}
                </AddGhost>
              )}
              <AddInput
                ref={inputRef}
                size={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commit(match ?? input);
                  }
                  if (e.key === 'Tab') {
                    const value = match ?? input;
                    if (value.trim()) {
                      e.preventDefault();
                      commit(value, true);
                    }
                  }
                  if (e.key === 'Escape') {
                    setInput('');
                    setAdding(false);
                  }
                }}
                onBlur={() => commit()}
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
