import { notFound } from "next/navigation";

/** Any unmatched path under /ar or /en renders the localized not-found page with a 404 status. */
export default function Missing() {
  notFound();
}
