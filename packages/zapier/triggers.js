const { version } = require("zapier-platform-core");

const triggers = {
  // Trigger: New Contact Created
  new_contact: {
    key: "new_contact",
    noun: "Contact",
    display: {
      label: "New Contact",
      description: "Triggers when a new contact is created.",
    },
    operation: {
      type: "hook",
      performSubscribe: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/webhooks`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
          },
          body: {
            url: bundle.targetUrl,
            events: ["contacto.creado"],
            secret: bundle.targetUrl,
          },
        });
        return {
          id: response.data.id,
          url: bundle.targetUrl,
        };
      },
      performUnsubscribe: async (z, bundle) => {
        if (bundle.subscribeData?.id) {
          await z.request({
            url: `${bundle.authData.apiUrl}/api/webhooks/${bundle.subscribeData.id}`,
            method: "DELETE",
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
        }
      },
      perform: (z, bundle) => {
        const cleanedData = { ...bundle.cleanedRequest };
        return [
          {
            id: cleanedData.id,
            nombre: cleanedData.nombre,
            email: cleanedData.email,
            telefono: cleanedData.telefono,
            empresa: cleanedData.empresa,
            cargo: cleanedData.cargo,
            createdAt: cleanedData.createdAt,
          },
        ];
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Juan Pérez",
        email: "juan@example.com",
        telefono: "+34 600 123 456",
        empresa: "Acme Inc.",
        cargo: "CEO",
        createdAt: new Date().toISOString(),
      },
    },
    sample: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      nombre: "Juan Pérez",
      email: "juan@example.com",
      telefono: "+34 600 123 456",
      empresa: "Acme Inc.",
      cargo: "CEO",
      createdAt: new Date().toISOString(),
    },
  },

  // Trigger: New Opportunity Created
  new_oportunidad: {
    key: "new_oportunidad",
    noun: "Opportunity",
    display: {
      label: "New Opportunity",
      description: "Triggers when a new opportunity is created.",
    },
    operation: {
      type: "hook",
      performSubscribe: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/webhooks`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
          },
          body: {
            url: bundle.targetUrl,
            events: ["oportunidad.creada"],
            secret: bundle.targetUrl,
          },
        });
        return {
          id: response.data.id,
          url: bundle.targetUrl,
        };
      },
      performUnsubscribe: async (z, bundle) => {
        if (bundle.subscribeData?.id) {
          await z.request({
            url: `${bundle.authData.apiUrl}/api/webhooks/${bundle.subscribeData.id}`,
            method: "DELETE",
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
        }
      },
      perform: (z, bundle) => {
        const cleanedData = { ...bundle.cleanedRequest };
        return [
          {
            id: cleanedData.id,
            nombre: cleanedData.nombre,
            descripcion: cleanedData.descripcion,
            importe: cleanedData.importe,
            probabilidad: cleanedData.probabilidad,
            pipelineId: cleanedData.pipelineId,
            stageId: cleanedData.stageId,
            contactoId: cleanedData.contactoId,
            propietarioId: cleanedData.propietarioId,
            createdAt: cleanedData.createdAt,
          },
        ];
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Nuevo Proyecto",
        descripcion: "Descripción del proyecto",
        importe: 50000,
        probabilidad: 50,
        pipelineId: "pipe-123",
        stageId: "stage-456",
        contactoId: "contact-789",
        createdAt: new Date().toISOString(),
      },
    },
  },

  // Trigger: Stage Changed
  stage_changed: {
    key: "stage_changed",
    noun: "Opportunity Stage",
    display: {
      label: "Stage Changed",
      description: "Triggers when an opportunity stage changes.",
    },
    operation: {
      type: "hook",
      performSubscribe: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/webhooks`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
          },
          body: {
            url: bundle.targetUrl,
            events: ["oportunidad.etapa_cambiada"],
            secret: bundle.targetUrl,
          },
        });
        return {
          id: response.data.id,
          url: bundle.targetUrl,
        };
      },
      performUnsubscribe: async (z, bundle) => {
        if (bundle.subscribeData?.id) {
          await z.request({
            url: `${bundle.authData.apiUrl}/api/webhooks/${bundle.subscribeData.id}`,
            method: "DELETE",
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
        }
      },
      perform: (z, bundle) => {
        const cleanedData = { ...bundle.cleanedRequest };
        return [
          {
            id: cleanedData.id,
            nombre: cleanedData.nombre,
            oldStageId: cleanedData.oldStageId,
            newStageId: cleanedData.newStageId,
            oldStageName: cleanedData.oldStageName,
            newStageName: cleanedData.newStageName,
            changedAt: cleanedData.changedAt || new Date().toISOString(),
          },
        ];
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Proyecto Alpha",
        oldStageId: "stage-123",
        newStageId: "stage-456",
        oldStageName: "Prospección",
        newStageName: "Negociación",
        changedAt: new Date().toISOString(),
      },
    },
  },

  // Trigger: Email Opened
  email_opened: {
    key: "email_opened",
    noun: "Email Open",
    display: {
      label: "Email Opened",
      description: "Triggers when a tracked email is opened.",
    },
    operation: {
      type: "hook",
      performSubscribe: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/webhooks`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
          },
          body: {
            url: bundle.targetUrl,
            events: ["email.abierto"],
            secret: bundle.targetUrl,
          },
        });
        return {
          id: response.data.id,
          url: bundle.targetUrl,
        };
      },
      performUnsubscribe: async (z, bundle) => {
        if (bundle.subscribeData?.id) {
          await z.request({
            url: `${bundle.authData.apiUrl}/api/webhooks/${bundle.subscribeData.id}`,
            method: "DELETE",
            headers: {
              Authorization: bundle.authData.apiKey
                ? `Bearer ${bundle.authData.apiKey}`
                : `Bearer ${bundle.authData.access_token}`,
            },
          });
        }
      },
      perform: (z, bundle) => {
        const cleanedData = { ...bundle.cleanedRequest };
        return [
          {
            campaignId: cleanedData.campaignId,
            contactoId: cleanedData.contactoId,
            email: cleanedData.email,
            openedAt: cleanedData.openedAt,
            userAgent: cleanedData.userAgent,
            ip: cleanedData.ip,
          },
        ];
      },
      sample: {
        campaignId: "campaign-123",
        contactoId: "contact-789",
        email: "juan@example.com",
        openedAt: new Date().toISOString(),
        userAgent: "Mozilla/5.0...",
        ip: "192.168.1.1",
      },
    },
  },
};
module.exports = triggers;
