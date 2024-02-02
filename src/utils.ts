import { ALLOWED_FIELDS } from "./handlers";
import { nullSearchableQueriesCI, nullSearchableQueriesCS } from "./state";

export function checkRequestedFields(fields: string): boolean {
  return fields.split(",").every((field) => ALLOWED_FIELDS.includes(field))
    ? true
    : false;
}

export function updateNullSearchableQueries(
  str: string,
  caseSensitive: boolean
): void {
  const cacheSize: number = Number(
    process.env.QUERY_NULL_SEARCHABLE_CACHE_SIZE
  );

  if (caseSensitive) {
    if (nullSearchableQueriesCS.length >= cacheSize) {
      nullSearchableQueriesCS.shift();
    }
    nullSearchableQueriesCS.push(str);
  } else {
    if (nullSearchableQueriesCI.length >= cacheSize) {
      nullSearchableQueriesCI.shift();
    }

    nullSearchableQueriesCI.push(str);
  }
}

/**
 * Retourne `true` si la chaîne ne contient pas :
 *   1. plus de 35 caractères ;
 *   2. plus de 3 caractères identiques d'affilée ;
 *   3. des caractères autres que les lettres grecques de base (digamma inclus) ;
 *   4. d'espace initiale, d'espaces consécutives et de `h` consécutifs.
 */
export function isSearchValueAcceptable(str: string): boolean {
  if (str.length > 35) return false;
  if (/(.)\1{3,}/.test(str)) return false;
  if (/[^αβγδεζηθικλμνξοπρστυφχψωϝ\s]/i.test(str)) return false;
  if (/^\s|[h\s]{2,}/.test(str)) return false;

  return true;
}
