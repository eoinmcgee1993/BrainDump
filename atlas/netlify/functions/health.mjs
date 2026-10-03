export default async () => new Response(JSON.stringify({
  service: "atlas-travelos",
  status: "ok",
  version: "2.0.0"
}), {
  status: 200,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store"
  }
});

export const config = {
  path: "/api/health",
  method: "GET"
};