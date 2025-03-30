import client from "prom-client";

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["methods", "route", "code"],
  buckets: [0.1, 5, 15, 50, 100, 300],
});
