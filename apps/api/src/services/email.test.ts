import { describe, it, expect } from "vitest";
import {
  buildTrackingId,
  parseTrackingId,
  injectOpenPixel,
  injectClickTracking,
  applyTracking,
} from "./email.js";

describe("email — tracking (Fase 0)", () => {
  describe("buildTrackingId", () => {
    it("null sin campaignId", () => {
      expect(buildTrackingId(null, "c1")).toBeNull();
      expect(buildTrackingId(undefined, undefined)).toBeNull();
    });

    it("solo campaignId", () => {
      expect(buildTrackingId("camp-1", null)).toBe("camp-1");
    });

    it("campaignId.contactoId", () => {
      expect(buildTrackingId("camp-1", "cont-9")).toBe("camp-1.cont-9");
    });
  });

  describe("parseTrackingId", () => {
    it("campaign simple", () => {
      expect(parseTrackingId("camp-1")).toEqual({
        campaignId: "camp-1",
        contactoId: null,
      });
    });

    it("campaign.contacto (uuids con guiones, sin puntos)", () => {
      const camp = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const cont = "11111111-2222-3333-4444-555555555555";
      expect(parseTrackingId(`${camp}.${cont}`)).toEqual({
        campaignId: camp,
        contactoId: cont,
      });
    });

    it("vacío", () => {
      expect(parseTrackingId("")).toEqual({
        campaignId: null,
        contactoId: null,
      });
    });
  });

  describe("injectOpenPixel", () => {
    it("inserta pixel antes de </body>", () => {
      const html = "<html><body><p>Hola</p></body></html>";
      const out = injectOpenPixel(html, "t1", "http://localhost:3001");
      expect(out).toContain('src="http://localhost:3001/api/track/open/t1"');
      expect(out.indexOf("track/open")).toBeLessThan(out.indexOf("</body>"));
    });

    it("append si no hay body", () => {
      const out = injectOpenPixel("<p>x</p>", "t1", "http://api/");
      expect(
        out.endsWith('style="display:none" />') || out.includes("track/open"),
      ).toBe(true);
      expect(out).toContain("http://api/api/track/open/t1");
    });
  });

  describe("injectClickTracking", () => {
    it("reescribe hrefs absolutos http(s)", () => {
      const html = '<a href="https://ejemplo.com/x">x</a>';
      const out = injectClickTracking(html, "t1", "http://localhost:3001");
      expect(out).toContain(
        "http://localhost:3001/api/track/click/t1?url=" +
          encodeURIComponent("https://ejemplo.com/x"),
      );
      expect(out).not.toContain('href="https://ejemplo.com/x"');
    });

    it("no reescribe URLs de tracking ya inyectadas", () => {
      const html =
        '<a href="http://localhost:3001/api/track/click/t1?url=https%3A%2F%2Fx">x</a>';
      const out = injectClickTracking(html, "t1", "http://localhost:3001");
      expect(out).toBe(html);
    });

    it("ignora mailto y relativos", () => {
      const html = '<a href="mailto:a@b.c">m</a><a href="/ruta">r</a>';
      const out = injectClickTracking(html, "t1", "http://x");
      expect(out).toContain('href="mailto:a@b.c"');
      expect(out).toContain('href="/ruta"');
    });
  });

  describe("applyTracking", () => {
    it("pixel + clicks juntos", () => {
      const html = '<body><a href="https://ok.com">l</a></body>';
      const out = applyTracking(html, "c1", "http://localhost:3001");
      expect(out).toContain("/api/track/open/c1");
      expect(out).toContain("/api/track/click/c1");
    });
  });
});
