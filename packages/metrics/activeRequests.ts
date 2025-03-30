import client from "prom-client";

export const activeRequestGauge = new client.Gauge({
  name: "active-requests",
  help: "Number of active requests",
});
