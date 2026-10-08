const { version } = require("zapier-platform-core");

const API_KEY_AUTH = "apiKey";
const OAUTH2_AUTH = "oauth2";

const authentication = {
  type: "multi",
  // API Key authentication (for server-to-server)
  [API_KEY_AUTH]: {
    type: "custom",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "string",
        required: true,
        helpText: "Your CRM API key (format: crm_...)",
      },
      {
        key: "apiUrl",
        label: "API Base URL",
        type: "string",
        required: true,
        default: "https://api.crm.example.com",
        helpText: "Base URL of your CRM instance",
      },
    ],
    test: async (z, bundle) => {
      const response = await z.request({
        url: `${bundle.authData.apiUrl}/api/auth/me`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${bundle.authData.apiKey}`,
        },
      });
      return { id: response.data.user?.id || "api-user", ...response.data };
    },
    connectionLabel: (z, bundle) =>
      `API Key: ${bundle.authData.apiKey?.slice(0, 12)}...`,
  },
  // OAuth2 authentication (for user-to-user)
  [OAUTH2_AUTH]: {
    type: "oauth2",
    oauth2Config: {
      authorizeUrl: {
        method: "GET",
        url: "https://auth.crm.example.com/oauth/authorize",
        params: {
          client_id: "{{process.env.CLIENT_ID}}",
          redirect_uri: "{{bundle.inputData.redirect_uri}}",
          response_type: "code",
          scope: "read write",
          state: "{{bundle.inputData.state}}",
        },
      },
      getAccessToken: {
        method: "POST",
        url: "https://auth.crm.example.com/oauth/token",
        params: {
          client_id: "{{process.env.CLIENT_ID}}",
          client_secret: "{{process.env.CLIENT_SECRET}}",
          grant_type: "authorization_code",
          code: "{{bundle.inputData.code}}",
          redirect_uri: "{{bundle.inputData.redirect_uri}}",
        },
      },
      refreshAccessToken: {
        method: "POST",
        url: "https://auth.crm.example.com/oauth/token",
        params: {
          client_id: "{{process.env.CLIENT_ID}}",
          client_secret: "{{process.env.CLIENT_SECRET}}",
          grant_type: "refresh_token",
          refresh_token: "{{bundle.authData.refresh_token}}",
        },
      },
      getConnectionLabel: (z, bundle) =>
        `OAuth: ${bundle.authData.email || bundle.authData.user_id}`,
      getRefreshToken: (z, bundle) => bundle.authData.refresh_token,
    },
    fields: [
      {
        key: "redirect_uri",
        label: "Redirect URI",
        required: true,
        type: "string",
      },
      { key: "state", label: "State", required: false, type: "string" },
    ],
    test: async (z, bundle) => {
      const response = await z.request({
        url: `${bundle.authData.apiUrl}/api/auth/me`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${bundle.authData.access_token}`,
        },
      });
      return { id: response.data.user?.id || "oauth-user", ...response.data };
    },
  },
  // Default to API Key
  default: API_KEY_AUTH,
  // Custom fields for both auth types
  fields: [
    {
      key: "tenantId",
      label: "Tenant ID",
      required: false,
      type: "string",
      helpText: 'Your tenant ID (optional, defaults to "default")',
      default: "default",
    },
  ],
};

module.exports = authentication;
