import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

interface AuthSuccessRequest {
  access_token: string;
  scope: string;
  token_type: string;
}

interface AuthBadRequest {
  error: string;
  error_description: string;
  error_uri: string;
}

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const port = process.env.PORT;

if (!clientId) {
  throw new Error("Client Id not found");
}

if (!clientSecret) {
  throw new Error("Client Secret not found");
}

if (!port) {
  throw new Error("Port not found");
}

new Elysia()
  .use(cors())
  .get("/", async (request) => {
    const code = request.query.code;

    if (!code) throw new Error("Code not found");

    const authUrl = new URL("https://github.com/login/oauth/access_token");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("client_secret", clientSecret);
    authUrl.searchParams.set("code", code);

    try {
      const response = await fetch(authUrl.toString(), {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json()) as
        | AuthSuccessRequest
        | AuthBadRequest;

      if ("error" in data) throw new Error(JSON.stringify(data));

      return data;
    } catch (error) {
      if (!(error instanceof Error)) throw new Error("Unknown error");

      return new Response(error.message, {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  })
  .get("/ping", () => "pong")
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return "Route not found :(";
    return new Response(error.message, { status: 400 });
  })
  .listen(port);

console.log(`Application start on port: ${port}`);
