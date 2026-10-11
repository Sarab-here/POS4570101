export const ROOT_ELEMENT_ID = 'root';

export function getAppRoot(documentRef: Document): HTMLElement {
  const root = documentRef.getElementById(ROOT_ELEMENT_ID);

  if (!root) {
    throw new Error(`Missing application mount element: #${ROOT_ELEMENT_ID}`);
  }

  return root;
}
