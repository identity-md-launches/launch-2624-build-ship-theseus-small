import { pathToFileURL } from 'node:url';

// Optional paths let validation tools live outside the source checkout.
export function loadPlaywright() {
  return process.env.IMD_PLAYWRIGHT
    ? import(pathToFileURL(process.env.IMD_PLAYWRIGHT).href)
    : import('playwright');
}

export function loadAxe() {
  return process.env.IMD_AXE
    ? import(pathToFileURL(process.env.IMD_AXE).href)
    : import('@axe-core/playwright');
}
