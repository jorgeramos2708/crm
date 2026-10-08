const actions = {
  // Action: Create Contact
  create_contact: {
    key: "create_contact",
    noun: "Contact",
    display: {
      label: "Create Contact",
      description: "Creates a new contact in the CRM.",
    },
    operation: {
      inputFields: [
        { key: "nombre", label: "Nombre", type: "string", required: true },
        { key: "email", label: "Email", type: "string", required: false },
        { key: "telefono", label: "Teléfono", type: "string", required: false },
        { key: "empresa", label: "Empresa", type: "string", required: false },
        { key: "cargo", label: "Cargo", type: "string", required: false },
        {
          key: "custom",
          label: "Campos personalizados",
          type: "json",
          required: false,
        },
      ],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/contactos`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
            "Content-Type": "application/json",
          },
          body: {
            nombre: bundle.inputData.nombre,
            email: bundle.inputData.email,
            telefono: bundle.inputData.telefono,
            empresa: bundle.inputData.empresa,
            cargo: bundle.inputData.cargo,
            custom: bundle.inputData.custom || {},
          },
        });
        return response.data;
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
  },

  // Action: Create Opportunity
  create_oportunidad: {
    key: "create_oportunidad",
    noun: "Opportunity",
    display: {
      label: "Create Opportunity",
      description: "Creates a new opportunity in the pipeline.",
    },
    operation: {
      inputFields: [
        { key: "nombre", label: "Nombre", type: "string", required: true },
        {
          key: "descripcion",
          label: "Descripción",
          type: "text",
          required: false,
        },
        {
          key: "pipelineId",
          label: "Pipeline ID",
          type: "string",
          required: true,
        },
        { key: "stageId", label: "Stage ID", type: "string", required: true },
        {
          key: "contactoId",
          label: "Contacto ID",
          type: "string",
          required: false,
        },
        { key: "importe", label: "Importe", type: "number", required: false },
        {
          key: "probabilidad",
          label: "Probabilidad (%)",
          type: "number",
          required: false,
          default: 50,
        },
        {
          key: "propietarioId",
          label: "Propietario ID",
          type: "string",
          required: false,
        },
        {
          key: "custom",
          label: "Campos personalizados",
          type: "json",
          required: false,
        },
      ],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/oportunidades`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
            "Content-Type": "application/json",
          },
          body: {
            nombre: bundle.inputData.nombre,
            descripcion: bundle.inputData.descripcion,
            pipelineId: bundle.inputData.pipelineId,
            stageId: bundle.inputData.stageId,
            contactoId: bundle.inputData.contactoId,
            importe: bundle.inputData.importe,
            probabilidad: bundle.inputData.probabilidad,
            propietarioId: bundle.inputData.propietarioId,
            custom: bundle.inputData.custom || {},
          },
        });
        return response.data;
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombre: "Nuevo Proyecto",
        descripcion: "Descripción del proyecto",
        pipelineId: "pipe-123",
        stageId: "stage-456",
        contactoId: "contact-789",
        importe: 50000,
        probabilidad: 50,
        createdAt: new Date().toISOString(),
      },
    },
  },

  // Action: Update Stage
  update_stage: {
    key: "update_stage",
    noun: "Opportunity Stage",
    display: {
      label: "Update Opportunity Stage",
      description: "Updates the stage of an opportunity.",
    },
    operation: {
      inputFields: [
        { key: "id", label: "Opportunity ID", type: "string", required: true },
        {
          key: "stageId",
          label: "New Stage ID",
          type: "string",
          required: true,
        },
      ],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/oportunidades/${bundle.inputData.id}`,
          method: "PUT",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
            "Content-Type": "application/json",
          },
          body: {
            stageId: bundle.inputData.stageId,
          },
        });
        return response.data;
      },
      sample: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        stageId: "stage-456",
        updatedAt: new Date().toISOString(),
      },
    },
  },

  // Action: Send Email
  send_email: {
    key: "send_email",
    noun: "Email",
    display: {
      label: "Send Email",
      description: "Sends an email using a template or raw content.",
    },
    operation: {
      inputFields: [
        { key: "to", label: "To", type: "string", required: true },
        { key: "subject", label: "Subject", type: "string", required: true },
        { key: "html", label: "HTML Content", type: "text", required: false },
        { key: "text", label: "Text Content", type: "text", required: false },
        {
          key: "templateId",
          label: "Template ID",
          type: "string",
          required: false,
        },
        {
          key: "campaignId",
          label: "Campaign ID",
          type: "string",
          required: false,
        },
        {
          key: "contactoId",
          label: "Contact ID",
          type: "string",
          required: false,
        },
        {
          key: "tracking",
          label: "Enable Tracking",
          type: "boolean",
          required: false,
          default: true,
        },
      ],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${bundle.authData.apiUrl}/api/email/send`,
          method: "POST",
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
            "Content-Type": "application/json",
          },
          body: {
            to: bundle.inputData.to,
            subject: bundle.inputData.subject,
            html: bundle.inputData.html,
            text: bundle.inputData.text,
            templateId: bundle.inputData.templateId,
            campaignId: bundle.inputData.campaignId,
            contactoId: bundle.inputData.contactoId,
            tracking: bundle.inputData.tracking !== false,
          },
        });
        return response.data;
      },
      sample: {
        messageId: "msg-123e4567-e89b-12d3-a456-426614174000",
        to: "juan@example.com",
        subject: "Test Email",
        sentAt: new Date().toISOString(),
      },
    },
  },

  // Action: Find Contact
  find_contact: {
    key: "find_contact",
    noun: "Contact",
    display: {
      label: "Find Contact",
      description: "Finds a contact by email or ID.",
    },
    operation: {
      inputFields: [
        { key: "email", label: "Email", type: "string", required: false },
        { key: "id", label: "Contact ID", type: "string", required: false },
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
          headers: {
            Authorization: bundle.authData.apiKey
              ? `Bearer ${bundle.authData.apiKey}`
              : `Bearer ${bundle.authData.access_token}`,
          },
        });

        const contacts = response.data.data || response.data;
        if (contacts.length === 0) {
          throw new Error("Contact not found");
        }
        return contacts[0];
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
};
module.exports = actions;
