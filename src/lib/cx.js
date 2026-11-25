/** Join class names, dropping empty values. */
export function cx(...names) {
  return names.filter(Boolean).join(' ');
}
