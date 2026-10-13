export function GET() {
  return Response.json({
    ok: true,
    service: "cloud-agent-brief",
    port: 43123,
    now: new Date().toISOString(),
  });
}
