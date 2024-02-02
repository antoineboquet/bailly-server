import { Database } from "bun:sqlite";
import chalk from "chalk";
import { HEADERS } from "./globals";
import { nullSearchableQueriesCI, nullSearchableQueriesCS } from "./state";
import {
  checkRequestedFields,
  isSearchValueAcceptable,
  updateNullSearchableQueries
} from "./utils";

export const ALLOWED_FIELDS = [
  "word",
  "uri",
  "searchable",
  "searchableCaseInsensitive",
  "excerpt",
  "htmlDefinition"
];

const DEFAULT_FIELDS: string =
  process.env.QUERY_DEFAULT_FIELDS || ALLOWED_FIELDS.join(",");

const MAX_ROWS: number = Number(process.env.QUERY_MAX_ROWS) || -1;

interface APIEntryResponse {
  data: {
    version?: string;
    definition: Partial<Entry>;
    siblings?: {
      previous: Partial<Entry>;
      next: Partial<Entry>;
    };
  };
}

interface APIEntriesResponse {
  data: {
    version?: string;
    definitions: Partial<Entry>;
    count: number;
    countAll: number;
  };
}

interface Entry {
  orderedID: number;
  word: string;
  uri: string;
  searchable: string;
  searchableCaseInsensitive: string;
  htmlDefinition: string;
  excerpt: string;
}

export function getEntryByURI(
  db: Database,
  uri: string,
  params: URLSearchParams
): Response {
  const fields = (params.get("fields") ?? DEFAULT_FIELDS).replace(/(,+$)/g, "");

  if (!checkRequestedFields(fields)) {
    return new Response(JSON.stringify("Request Invalid Fields"), {
      ...HEADERS,
      status: 400,
      statusText: "Request Invalid Fields"
    });
  }

  let entry: any = db
    .query(`SELECT orderedID,${fields} FROM dictionary WHERE uri = $uri`)
    .get({ $uri: decodeURIComponent(uri) });

  if (entry && !params.has("siblings")) {
    delete entry.orderedID;

    const response: APIEntryResponse = {
      data: {
        version: process.env.DB_VERSION,
        definition: entry
      }
    };

    return new Response(JSON.stringify(response), { ...HEADERS });
  }

  if (entry?.orderedID && params.has("siblings")) {
    let siblings: any = db
      .query(
        `
            SELECT orderedID,uri,word
            FROM dictionary
            WHERE orderedID = $previousID
            OR orderedID = $nextID
            ORDER BY orderedID
          `
      )
      .all({
        $previousID: entry.orderedID - 1,
        $nextID: entry.orderedID + 1
      });

    let previousEntry: Partial<Entry> = {};
    let nextEntry: Partial<Entry> = {};

    if (siblings.length === 1) {
      switch (siblings[0].orderedID) {
        case entry.orderedID - 1:
          previousEntry = siblings[0];
          break;
        case entry.orderedID + 1:
          nextEntry = siblings[0];
          break;
      }
    } else {
      previousEntry = siblings[0];
      nextEntry = siblings[1];
    }

    delete entry.orderedID;
    delete previousEntry.orderedID;
    delete nextEntry.orderedID;

    const response: APIEntryResponse = {
      data: {
        version: process.env.DB_VERSION,
        definition: entry,
        siblings: {
          previous: previousEntry,
          next: nextEntry
        }
      }
    };

    return new Response(JSON.stringify(response), { ...HEADERS });
  }

  return new Response(JSON.stringify("Entry Not Found"), {
    ...HEADERS,
    status: 404,
    statusText: "Entry Not Found"
  });
}

export function getEntryByWord(
  db: Database,
  greekWord: string,
  params: URLSearchParams
): Response {
  const fields = (params.get("fields") ?? DEFAULT_FIELDS).replace(/(,+$)/g, "");

  if (!checkRequestedFields(fields)) {
    return new Response(JSON.stringify("Request Invalid Fields"), {
      ...HEADERS,
      status: 400,
      statusText: "Request Invalid Fields"
    });
  }

  let entry: any = db
    .query(`SELECT orderedID,${fields} FROM dictionary WHERE word = $word`)
    .get({ $word: decodeURIComponent(greekWord) });

  if (entry) {
    const response: APIEntryResponse = {
      data: {
        version: process.env.DB_VERSION,
        definition: entry
      }
    };

    return new Response(JSON.stringify(response), { ...HEADERS });
  }

  return new Response(JSON.stringify("Entry Not Found"), {
    ...HEADERS,
    status: 404,
    statusText: "Entry Not Found"
  });
}

export function getEntriesBySearchable(
  db: Database,
  searchable: string,
  params: URLSearchParams
): Response {
  if (!isSearchValueAcceptable(searchable)) {
    return new Response(JSON.stringify("Entries Not Found"), {
      ...HEADERS,
      status: 404,
      statusText: "Entries Not Found"
    });
  }

  const fields = (params.get("fields") ?? DEFAULT_FIELDS).replace(/(,+$)/g, "");

  if (!checkRequestedFields(fields)) {
    return new Response(JSON.stringify("Request Invalid Fields"), {
      ...HEADERS,
      status: 400,
      statusText: "Request Invalid Fields"
    });
  }

  if (
    (params.has("caseSensitive") &&
      nullSearchableQueriesCS.includes(searchable)) ||
    nullSearchableQueriesCI.includes(searchable)
  ) {
    return new Response(JSON.stringify("Entries Not Found"), {
      ...HEADERS,
      status: 404,
      statusText: "Entries Not Found"
    });
  }

  let query: string[] = [];
  let queryParams: any = {};

  query.push(`SELECT ${fields}`);

  // `countAll` : compter l'ensemble des résultats obtenus
  // par ressemblance du début de la chaîne recherchée.
  query.push(",(SELECT COUNT(orderedID) FROM dictionary");
  if (params.has("caseSensitive")) {
    query.push("WHERE searchable LIKE $searchableLike");
    queryParams.$searchableLike = searchable + "%";
  } else {
    query.push(
      "WHERE searchableCaseInsensitive LIKE $searchableLikeCaseInsensitive"
    );
    queryParams.$searchableLikeCaseInsensitive = searchable.toLowerCase() + "%";
  }
  query.push(") AS countAll");

  query.push("FROM dictionary");

  if (params.has("exact")) {
    if (params.has("caseSensitive")) {
      query.push("WHERE searchable = $searchable");
      queryParams.$searchable = searchable;
    } else {
      query.push(
        "WHERE searchableCaseInsensitive = $searchableCaseInsensitive"
      );
      queryParams.$searchableCaseInsensitive = searchable.toLowerCase();
    }
  } else {
    if (params.has("caseSensitive")) {
      query.push("WHERE searchable LIKE $searchableLike");
      queryParams.$searchableLike = searchable + "%";
    } else {
      query.push(
        "WHERE searchableCaseInsensitive LIKE $searchableLikeCaseInsensitive"
      );
      queryParams.$searchableLikeCaseInsensitive =
        searchable.toLowerCase() + "%";
    }
  }

  query.push("ORDER BY orderedID");
  query.push("LIMIT $limit");

  if (params.has("limit") && Number(params.get("limit")) <= MAX_ROWS) {
    queryParams.$limit = Number(params.get("limit"));
  } else {
    queryParams.$limit = MAX_ROWS;

    if (params.has("limit") && Number(params.get("limit")) > MAX_ROWS) {
      console.info(
        chalk.yellow(
          `The following request exceeds the authorized limit and`,
          `was reduced to ${chalk.bold(MAX_ROWS)} rows.`
        )
      );
    }
  }

  if (params.get("offset")) {
    query.push("OFFSET $offset");
    queryParams.$offset = params.get("offset");
  }

  let entries: any = db.query(query.join(" ")).all(queryParams);

  if (entries.length) {
    // `countAll` est reproduit dans chaque élément retourné.
    const countAll = entries[0]?.countAll ?? undefined;

    for (let i = 0; i < entries.length; i++) {
      delete entries[i].countAll;
    }

    const response: APIEntriesResponse = {
      data: {
        version: process.env.DB_VERSION,
        count: entries.length,
        countAll: countAll, // résultats par ressemblance
        definitions: entries
      }
    };

    return new Response(JSON.stringify(response), { ...HEADERS });
  }

  if (!params.has("exact") && !params.has("offset")) {
    if (!params.has("limit") || Number(params.get("limit")) > 0) {
      updateNullSearchableQueries(searchable, params.has("caseSensitive"));
    }
  }

  return new Response(JSON.stringify("Entries Not Found"), {
    ...HEADERS,
    status: 404,
    statusText: "Entries Not Found"
  });
}
