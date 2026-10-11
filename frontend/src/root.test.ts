import { beforeEach, describe, expect, it } from 'vitest';

import { getAppRoot, ROOT_ELEMENT_ID } from './root';

describe('frontend bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="${ROOT_ELEMENT_ID}"></div>`;
  });

  it('finds the application mount element', () => {
    const root = document.getElementById(ROOT_ELEMENT_ID);

    expect(getAppRoot(document)).toBe(root);
  });
});
