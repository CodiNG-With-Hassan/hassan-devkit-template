export type { components, operations, paths } from './generated/api';

import type { components } from './generated/api';

/**
 * Convenience accessor for a named DTO from the API spec:
 *
 *   import type { Schema } from 'api-types';
 *   type ErrorBody = Schema<'ErrorResponse'>;
 */
export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];
