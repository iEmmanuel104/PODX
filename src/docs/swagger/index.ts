/**
 * This file serves as an index for all Swagger documentation.
 * It doesn't contain any actual documentation, but is used to make
 * sure all documentation files are included in the build.
 */

// Import all swagger documentation files to ensure they are processed
import './users.swagger';
import './calls.swagger';
import './webhooks.swagger';

// Export a simple flag that can be used to check if swagger is loaded
export const swaggerDocsLoaded = true; 