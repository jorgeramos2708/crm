const resources = {
  contact: {
    key: "contact",
    noun: "Contact",
    list: {
      display: {
        label: "List Contacts",
        description: "Returns a list of contacts.",
      },
      operation: {
        inputFields: [
          {
            key: "limit",
            label: "Limit",
            type: "integer",
            required: false,
            default: 20,
          },
          {
            key: "offset",
            label: "Offset",
            type: "integer",
            required: false,
            default: 0,
          },
          { key: "q", label: "Search", type: "string", required: false },
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams();
          params.append("limit", bundle.inputData.limit || 20);
          params.append("offset", bundle.inputData.offset || 0);
          if (bundle.inputData.q) params.append("q", bundle.inputData.q);

          const response = await z.request({
            url: `${bundle.authData.apiUrl}/api/contactos`,
            method: "GET",
            params,
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
          return response.data.data || response.data;
        },
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Juan Pérez",
        email: "juan@example.com",
        telefono: "+34 600 123 456",
        empresa: "Acme Inc.",
        cargo: "CEO",
      },
    },
  },

  oportunidad: {
    key: "oportunidad",
    noun: "Opportunity",
    list: {
      display: {
        label: "List Opportunities",
        description: "Returns a list of opportunities.",
      },
      operation: {
        inputFields: [
          {
            key: "limit",
            label: "Limit",
            type: "integer",
            required: false,
            default: 20,
          },
          {
            key: "offset",
            label: "Offset",
            type: "integer",
            required: false,
            default: 0,
          },
          {
            key: "stageId",
            label: "Stage ID",
            type: "string",
            required: false,
          },
          {
            key: "pipelineId",
            label: "Pipeline ID",
            type: "string",
            required: false,
          },
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams();
          params.append("limit", bundle.inputData.limit || 20);
          params.append("offset", bundle.inputData.offset || 0);
          if (bundle.inputData.stageId)
            params.append("stageId", bundle.inputData.stageId);
          if (bundle.inputData.pipelineId)
            params.append("pipelineId", bundle.inputData.pipelineId);

          const response = await z.request({
            url: `${bundle.authData.apiUrl}/api/oportunidades`,
            method: "GET",
            params,
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
          return response.data.data || response.data;
        },
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Nuevo Proyecto",
        descripcion: "Descripción del proyecto",
        pipelineId: "pipe-123",
        stageId: "stage-456",
        importe: 50000,
        probabilidad: 50,
      },
    },
  },

  pipeline: {
    key: "pipeline",
    noun: "Pipeline",
    list: {
      display: {
        label: "List Pipelines",
        description: "Returns a list of pipelines.",
      },
      operation: {
        inputFields: [],
        perform: async (z, bundle) => {
          const response = await z.request({
            url: `${bundle.authData.apiUrl}/api/pipelines`,
            method: "GET",
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
          return response.data.data || response.data;
        },
      },
      sample: {
        id: "pipe-123",
        nombre: "Pipeline Principal",
        descripcion: "Pipeline principal de ventas",
        activo: true,
      },
    },
  },

  campaign: {
    key: "campaign",
    noun: "Campaign",
    list: {
      display: {
        label: "List Campaigns",
        description: "Returns a list of email campaigns.",
      },
      operation: {
        inputFields: [
          {
            key: "limit",
            label: "Limit",
            type: "integer",
            required: false,
            default: 20,
          },
          {
            key: "offset",
            label: "Offset",
            type: "integer",
            required: false,
            default: 0,
          },
        ],
        perform: async (z, bundle) => {
          const params = new URLSearchParams();
          params.append("limit", bundle.inputData.limit || 20);
          params.append("offset", bundle.inputData.offset || 0);

          const response = await z.request({
            url: `${bundle.authData.apiUrl}/api/email-campaigns`,
            method: "GET",
            params,
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
          return response.data.data || response.data;
        },
      },
      sample: {
        id: "campaign-123",
        nombre: "Campaña de Verano",
        estado: "enviada",
        programadaPara: new Date().toISOString(),
      },
    },
  },

  template: {
    key: "template",
    noun: "Email Template",
    list: {
      display: {
        label: "List Email Templates",
        description: "Returns a list of email templates.",
      },
      operation: {
        inputFields: [],
        perform: async (z, bundle) => {
          const response = await z.request({
            url: `${bundle.authData.apiUrl}/api/email-templates`,
            method: "GET",
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
          return response.data.data || response.data;
        },
      },
      sample: {
        id: "template-123",
        nombre: "Plantilla Bienvenida",
        asunto: "Bienvenido a {{nombre}}",
        contenidoHtml: "<h1>Hola {{nombre}}</h1>",
        variables: ["nombre", "empresa"],
      },
    },
  },
};
module.exports = resources;
