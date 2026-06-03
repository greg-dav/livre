import createError from 'http-errors';
import { type LibraryFormat as LibraryFormatInfo } from '@livre/types';
import { type LibraryFormat } from '../formats/LibraryFormat';

/**
 * Owns the registered import/export {@link LibraryFormat} adapters, keyed by id, and resolves them
 * for consumers — so LibraryTransferService asks for a format the same way it asks the
 * {@link BookSourceRegistry} for a source, rather than hand-keying a Map inline. Adding a format is a
 * registration in the composition root.
 */
export class FormatRegistry {
  private readonly formats: Map<string, LibraryFormat>;

  constructor(formats: LibraryFormat[]) {
    this.formats = new Map(formats.map((f) => [f.id, f]));
  }

  /** Client-facing list of available formats; drives the import/export modals. */
  list(): LibraryFormatInfo[] {
    return [...this.formats.values()].map((f) => ({
      id: f.id,
      label: f.label,
      fileExtension: f.fileExtension,
      capabilities: f.capabilities,
    }));
  }

  /** Resolve a format that supports the given direction, or throw a client-facing error. */
  require(formatId: string, capability: 'import' | 'export'): LibraryFormat {
    const format = this.formats.get(formatId);
    if (!format) throw createError(404, `Unknown format: ${formatId}`);
    if (!format.capabilities[capability]) {
      throw createError(400, `Format ${formatId} does not support ${capability}`);
    }
    return format;
  }
}
