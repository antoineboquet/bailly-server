export const HEADERS = {
  headers: {
    "Access-Control-Allow-Origin": "https://bailly.app",
    "Access-Control-Allow-Methods": "OPTIONS,GET",
    "Access-Control-Allow-Headers": "access-control-allow-origin,credentials",
    "Content-Type": "application/json"
  }
};

export const URL_PREFIX = /^[a-z]+$/.test(process.env.URL_PREFIX || "")
  ? process.env.URL_PREFIX
  : undefined;
