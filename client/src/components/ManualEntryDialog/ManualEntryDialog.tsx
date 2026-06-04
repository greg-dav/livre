import { type FormEvent } from 'react';
import { Button, ScrollDialog, Icon, Input, Text, Textarea } from '@livre/primitives';
import { type ShelfStatus } from '@livre/types';
import { errorMessage } from '../../lib/errorMessage';
import { useManualEntry } from './useManualEntry';
import {
  Fields,
  Field,
  FieldRow,
  ShelfPicker,
  ShelfOption,
  MoreToggle,
  MoreWrap,
  MoreInner,
  MoreFields,
} from './ManualEntryDialog.styles';

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the title — used when escalating from a search query that found nothing. */
  seedTitle?: string;
}

const SHELF_OPTIONS: { value: ShelfStatus; label: string }[] = [
  { value: 'read', label: 'Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'want', label: 'Want to Read' },
  { value: 'dnf', label: 'Did Not Finish' },
];

/**
 * Create a book by hand, for titles the catalog doesn't have or that the reader would rather not
 * fetch. Asks for only title, author, and shelf up front; the rest of the metadata is tucked behind
 * a disclosure so the common case stays a three-field form. Controlled by the caller so it can be
 * triggered from anywhere — the Search screen, the quick-search dropdown, the empty library — with
 * an optional seeded title. All form state and the create-and-navigate flow live in useManualEntry.
 */
export const ManualEntryDialog = (props: ManualEntryDialogProps) => {
  const form = useManualEntry(props.open, props.seedTitle, () => props.onOpenChange(false));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.isValid && !form.isPending) form.submit();
  };

  return (
    <ScrollDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Add a book manually"
      description="Enter a book that isn't in the catalog. You can edit any of these later."
      onSubmit={handleSubmit}
      footer={
        <>
          <ScrollDialog.Close asChild>
            <Button variant="ghost" size="sm" type="button">
              <Text variant="label">Cancel</Text>
            </Button>
          </ScrollDialog.Close>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!form.isValid || form.isPending}
          >
            <Text variant="label" color="onColor">
              {form.isPending ? 'Adding…' : 'Add to library'}
            </Text>
          </Button>
        </>
      }
    >
      <Fields>
        <Field>
          <Text variant="label" color="muted">
            Title
          </Text>
          <Input
            value={form.title}
            autoFocus
            placeholder="Book title"
            onChange={(e) => form.setTitle(e.target.value)}
          />
        </Field>

        <Field>
          <Text variant="label" color="muted">
            Author
          </Text>
          <Input
            value={form.authors}
            placeholder="Separate multiple authors with commas"
            onChange={(e) => form.setAuthors(e.target.value)}
          />
        </Field>

        <Field>
          <Text variant="label" color="muted">
            Shelf
          </Text>
          <ShelfPicker>
            {SHELF_OPTIONS.map((option) => {
              const selected = form.status === option.value;
              return (
                <ShelfOption
                  key={option.value}
                  type="button"
                  $selected={selected}
                  onClick={() => form.setStatus(option.value)}
                >
                  <Text variant="ui-sm" color={selected ? 'accent' : 'default'}>
                    {option.label}
                  </Text>
                </ShelfOption>
              );
            })}
          </ShelfPicker>
        </Field>

        <MoreToggle type="button" onClick={() => form.setShowMore(!form.showMore)}>
          <span
            style={{
              display: 'inline-flex',
              transform: form.showMore ? 'rotate(180deg)' : 'none',
            }}
          >
            <Icon icon="chevron-down" size={14} />
          </span>
          <Text variant="ui-sm" color="muted">
            {form.showMore ? 'Fewer details' : 'More details — cover, ISBN, pages, publisher…'}
          </Text>
        </MoreToggle>

        <MoreWrap $open={form.showMore} aria-hidden={!form.showMore}>
          <MoreInner>
            <MoreFields>
              <Field>
                <Text variant="label" color="muted">
                  Cover image URL
                </Text>
                <Input
                  value={form.coverUrl}
                  placeholder="https://…"
                  tabIndex={form.showMore ? undefined : -1}
                  onChange={(e) => form.setCoverUrl(e.target.value)}
                />
              </Field>
              <FieldRow>
                <Field>
                  <Text variant="label" color="muted">
                    ISBN
                  </Text>
                  <Input
                    value={form.isbn}
                    tabIndex={form.showMore ? undefined : -1}
                    onChange={(e) => form.setIsbn(e.target.value)}
                  />
                </Field>
                <Field>
                  <Text variant="label" color="muted">
                    Pages
                  </Text>
                  <Input
                    type="number"
                    value={form.pageCount}
                    tabIndex={form.showMore ? undefined : -1}
                    onChange={(e) => form.setPageCount(e.target.value)}
                  />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field>
                  <Text variant="label" color="muted">
                    Publisher
                  </Text>
                  <Input
                    value={form.publisher}
                    tabIndex={form.showMore ? undefined : -1}
                    onChange={(e) => form.setPublisher(e.target.value)}
                  />
                </Field>
                <Field>
                  <Text variant="label" color="muted">
                    Published
                  </Text>
                  <Input
                    value={form.publishedDate}
                    placeholder="YYYY"
                    tabIndex={form.showMore ? undefined : -1}
                    onChange={(e) => form.setPublishedDate(e.target.value)}
                  />
                </Field>
              </FieldRow>
              <Field>
                <Text variant="label" color="muted">
                  Description
                </Text>
                <Textarea
                  value={form.description}
                  rows={4}
                  placeholder="A short note about the book…"
                  tabIndex={form.showMore ? undefined : -1}
                  onChange={(e) => form.setDescription(e.target.value)}
                />
              </Field>
            </MoreFields>
          </MoreInner>
        </MoreWrap>

        {form.error && (
          <Text variant="ui-sm" color="destructive">
            {errorMessage(form.error, 'Failed to add the book')}
          </Text>
        )}
      </Fields>
    </ScrollDialog>
  );
};
