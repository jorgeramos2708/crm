const { version, platformVersion } = require("zapier-platform-core");

const authentication = require("./authentication");
const triggers = require("./triggers");
const actions = require("./actions");
const resources = require("./resources");

module.exports = {
  version,
  platformVersion,
  authentication,
  beforeRequest: [
    (request, z, bundle) => {
      // Add tenant ID to requests if available
      if (bundle.authData.tenantId) {
        request.headers["X-Tenant-ID"] = bundle.authData.tenantId;
      }
      return request;
    },
  ],
  afterResponse: [
    (response, z, bundle) => {
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error("Rate limited. Please try again later.");
      }
      return response;
    },
  ],
  triggers: {
    ...triggers,
  },
  actions: {
    ...actions,
  },
  resources: {
    ...resources,
  },
  searches: {
    contact: {
      display: {
        label: "Find Contact",
        description: "Finds a contact by email or ID.",
      },
      operation: {
        inputFields: [
          { key: "email", label: "Email", required: false },
          { key: "id", label: "Contact ID", required: false },
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams();
          if (bundle.inputData.email)
            params.append("email", bundle.inputData.email);
          if (bundle.inputData.id) params.append("id", bundle.inputData.id);

          const response = await z.request({
            url: `${bundle.authData.apiUrl}/api/contactos`,
            method: "GET",
            params,
          });

          const contacts = response.data.data || response.data;
          return contacts.length > 0 ? contacts[0] : null;
        },
      },
    },
  },
};
