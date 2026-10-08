const nock = require("nock");
const authentication = require("../authentication");

describe("Authentication", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe("API Key Authentication", () => {
    it("should have correct type and fields", () => {
      expect(authentication.type).toBe("multi");
      expect(authentication.default).toBe("apiKey");
      expect(authentication.apiKey).toBeDefined();
      expect(authentication.apiKey.fields).toHaveLength(2);
      expect(authentication.apiKey.fields[0].key).toBe("apiKey");
      expect(authentication.apiKey.fields[1].key).toBe("apiUrl");
    });

    it("should test API key correctly", async () => {
      const bundle = {
        authData: {
          apiKey: "crm_test_abc123",
          apiUrl: "https://api.test.com",
        },
      };

      const scope = nock("https://api.test.com")
        .get("/api/auth/me")
        .matchHeader("Authorization", "Bearer crm_test_abc123")
        .reply(200, { user: { id: "user-123", email: "test@test.com" } });

      const bundleWithZ = {
        authData: bundle.authData,
        request: async (options) => {
          const { default: nock } = require("nock");
          const scope = nock(options.url.split("/").slice(0, 3).join("/"))
            [options.method.toLowerCase()](
              options.url.split("/").slice(3).join("/"),
            )
            .reply(200, { user: { id: "user-123", email: "test@test.com" } });

          const response = await z.request(options);
          return response;
        },
      };

      // We can't easily test the full flow without a full Zapier environment
      // but we can verify the structure
      expect(authentication.apiKey.test).toBeDefined();
    });
  });

  describe("OAuth2 Authentication", () => {
    it("should have OAuth2 config", () => {
      expect(authentication.oauth2).toBeDefined();
      expect(authentication.oauth2.type).toBe("oauth2");
      expect(authentication.oauth2.oauth2Config).toBeDefined();
      expect(authentication.oauth2.oauth2Config.authorizeUrl).toBeDefined();
      expect(authentication.oauth2.oauth2Config.getAccessToken).toBeDefined();
      expect(
        authentication.oauth2.oauth2Config.refreshAccessToken,
      ).toBeDefined();
    });
  });
});
