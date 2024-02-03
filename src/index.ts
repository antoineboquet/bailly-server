import { Database } from "bun:sqlite";
import chalk from "chalk";
import { HEADERS, URL_PREFIX } from "./globals";
import {
  getEntriesBySearchable,
  getEntryByURI,
  getEntryByWord
} from "./handlers";

const db = new Database(
  import.meta.dir + process.env.DB_PATH + process.env.DB_FILE,
  { readonly: true }
);

const server = Bun.serve({
  port: process.env.PORT ?? 3000,
  fetch(request: Request) {
    const { method } = request;
    const { host, pathname, searchParams } = new URL(request.url);
    const badApiLocationMessage = `The API is located at ${host}/${URL_PREFIX}`;

    // Requêtes CORS "preflight".
    if (method === "OPTIONS") {
      return new Response(JSON.stringify("OK"), {
        ...HEADERS,
        status: 200,
        statusText: "OK"
      });
    }

    // Définition d'une réponse par défaut.
    let response = new Response(JSON.stringify("Not Found"), {
      ...HEADERS,
      status: 404,
      statusText: "Not Found"
    });

    // Extraction des segments de la route.
    let segments: string[] = pathname.match(/[^/]+/g) ?? [];

    // Si un préfixe d'URL a été défini, le supprimer de la route.
    if (URL_PREFIX) {
      segments.shift();

      if (URL_PREFIX && !pathname.startsWith("/" + URL_PREFIX)) {
        response = new Response(JSON.stringify(badApiLocationMessage), {
          ...HEADERS,
          status: 301,
          statusText: badApiLocationMessage
        });
      }
    }

    if (!segments.length) {
      if (URL_PREFIX && !pathname.startsWith("/" + URL_PREFIX)) {
        response = new Response(JSON.stringify(badApiLocationMessage), {
          ...HEADERS,
          status: 301,
          statusText: badApiLocationMessage
        });
      } else {
        response = new Response(JSON.stringify("OK"), {
          ...HEADERS,
          status: 200,
          statusText: "OK"
        });
      }
    }

    // Une route comprend a minima la ressource demandée et la chaîne
    // recherchée. Les ressources sont uniquement proosées à la lecture.
    if (segments.length >= 2 && method === "GET") {
      const firstLevelRoute = segments[0];
      const secondLevelRoute = segments[1];

      switch (firstLevelRoute) {
        // Item unique.
        case "definition":
          if (secondLevelRoute === "word") {
            // /definition/word/<greek_word>
            if (!segments[2]) break;

            response = getEntryByWord(
              db,
              decodeURIComponent(segments[2]),
              searchParams
            );
          } else {
            // /definition/<uri>
            response = getEntryByURI(
              db,
              decodeURIComponent(secondLevelRoute),
              searchParams
            );
          }
          break;

        // Plusieurs items.
        case "definitions":
          // /definitions/<searchable>
          response = getEntriesBySearchable(
            db,
            decodeURIComponent(secondLevelRoute),
            searchParams
          );
          break;
      }
    }

    const logStatus = response.ok
      ? chalk.black.bgGreen.bold(response.status)
      : chalk.whiteBright.bgRed.bold(response.status);

    const logStatusText = response.ok
      ? chalk.green(response.statusText)
      : chalk.red(response.statusText);

    console.log(
      chalk.black.bgWhite.bold(method),
      logStatus + `${logStatusText ? " " + logStatusText : ""}`,
      chalk.bold(decodeURI(pathname)),
      Object.fromEntries(searchParams),
      "\n"
    );

    return response;
  }
});

console.clear();
console.info(chalk.green.bold(`Server is running on port ${server.port} 🏇\n`));
