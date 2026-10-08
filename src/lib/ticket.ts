// User-facing ticket code, derived from a report's id — bug reports and
// feature requests live in separate tables, so a sequential counter would
// collide across them. The tail of a cuid is the random part, so the same
// five characters are used on the hunter's report page and in admin to match
// a ticket someone quotes to the row you're looking at.
export function ticketCode(id: string): string {
  return `#RPT-${id.slice(-5).toUpperCase()}`;
}
