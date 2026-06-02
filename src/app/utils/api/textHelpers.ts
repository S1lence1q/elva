export const decodeHTMLEntities = (text: string): string => {
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  } catch {
    return text;
  }
};
