const nock = require("nock");

describe("Actions", () => {
  const actions = require("../actions");

  afterEach(() => {
    nock.cleanAll();
  });

  describe("Create Contact", () => {
    it("should have correct key and display", () => {
      expect(actions.create_contact.key).toBe("create_contact");
      expect(actions.create_contact.noun).toBe("Contact");
      expect(actions.create_contact.display.label).toBe("Create Contact");
    });

    it("should have required input fields", () => {
      const fields = actions.create_contact.operation.inputFields;
      expect(
        fields.find((f) => f.key === "nombre" && f.required),
      ).toBeDefined();
      expect(fields.find((f) => f.key === "email")).toBeDefined();
      expect(fields.find((f) => f.key === "telefono")).toBeDefined();
      expect(fields.find((f) => f.key === "empresa")).toBeDefined();
      expect(fields.find((f) => f.key === "cargo")).toBeDefined();
      expect(fields.find((f) => f.key === "custom")).toBeDefined();
    });

    it("should have perform method", () => {
      expect(actions.create_contact.operation.perform).toBeDefined();
    });
  });

  describe("Create Opportunity", () => {
    it("should have correct key and display", () => {
      expect(actions.create_oportunidad.key).toBe("create_oportunidad");
      expect(actions.create_oportunidad.noun).toBe("Opportunity");
      expect(actions.create_oportunidad.display.label).toBe(
        "Create Opportunity",
      );
    });

    it("should have required input fields", () => {
      const fields = actions.create_oportunidad.operation.inputFields;
      const requiredFields = ["nombre", "pipelineId", "stageId"];
      requiredFields.forEach((key) => {
        expect(fields.find((f) => f.key === key && f.required)).toBeDefined();
      });
    });
  });

  describe("Update Stage", () => {
    it("should have correct key and display", () => {
      expect(actions.update_stage.key).toBe("update_stage");
      expect(actions.update_stage.noun).toBe("Opportunity Stage");
    });

    it("should have required fields", () => {
      const fields = actions.update_stage.operation.inputFields;
      expect(fields.find((f) => f.key === "id" && f.required)).toBeDefined();
      expect(
        fields.find((f) => f.key === "stageId" && f.required),
      ).toBeDefined();
    });
  });

  describe("Send Email", () => {
    it("should have correct key and display", () => {
      expect(actions.send_email.key).toBe("send_email");
      expect(actions.send_email.noun).toBe("Email");
    });

    it("should have required fields", () => {
      const fields = actions.send_email.operation.inputFields;
      const requiredFields = ["to", "subject"];
      requiredFields.forEach((key) => {
        expect(fields.find((f) => f.key === key && f.required)).toBeDefined();
      });
    });
  });

  describe("Find Contact", () => {
    it("should have correct key and display", () => {
      expect(actions.find_contact.key).toBe("find_contact");
      expect(actions.find_contact.noun).toBe("Contact");
    });

    it("should have email and id fields", () => {
      const fields = actions.find_contact.operation.inputFields;
      expect(fields.find((f) => f.key === "email")).toBeDefined();
      expect(fields.find((f) => f.key === "id")).toBeDefined();
    });
  });
});
