declare namespace Cloudflare {
  interface Env {
    DLIFE_AUTH_SECRET?: string;
    DLIFE_AUTH_URL?: string;
    DLIFE_OWNER_SETUP?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
