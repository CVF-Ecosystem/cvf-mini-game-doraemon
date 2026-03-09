import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("telemetry route", () => {
  it("accepts allowed telemetry event", async () => {
    const request = new Request("http://localhost/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "round_start",
        payload: { game: "math" },
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { ok: boolean; receivedAt?: string };

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(typeof data.receivedAt).toBe("string");
  });

  it("accepts newly added boss telemetry event", async () => {
    const request = new Request("http://localhost/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "boss_round_start",
        payload: { bossRoundNumber: 2 },
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("rejects missing event", async () => {
    const request = new Request("http://localhost/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: { foo: "bar" },
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("invalid_event");
  });

  it("rejects unknown event", async () => {
    const request = new Request("http://localhost/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "unknown_event",
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("invalid_event");
  });

  it("returns bad_request for malformed JSON", async () => {
    const request = new Request("http://localhost/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{bad-json",
    });

    const response = await POST(request);
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("bad_request");
  });
});
