export * from './utils/logger.js';
export * from './types/index.js';

export function buildInfo() {
  return {
    version: '0.1.0',
    time: new Date().toISOString()
  };
}
