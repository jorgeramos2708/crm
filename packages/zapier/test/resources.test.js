const nock = require("nock");

describe("Resources", () => {
  const resources = require("../resources");

  afterEach(() => {
    nock.cleanAll();
  });

  describe("Contact Resource", () => {
    it("should have correct key and noun", () => {
      expect(resources.contact.key).toBe("contact");
      expect(resources.contact.noun).toBe("Contact");
    });

    it("should have list operation", () => {
      expect(resources.contact.list).toBeDefined();
      expect(resources.contact.list.operation).toBeDefined();
    });

    it("should have input fields for filtering", () => {
      const fields = resources.contact.list.operation.inputFields;
      expect(
        resources.contact.list.operation.inputFields.find(
          (f) => f.key === "limit",
        ),
      ).toBeDefined();
      expect(
        resources.contact.list.operation.inputFields.find(
          (f) => f.key === "offset",
        ),
      ).toBeDefined();
      expect(
        resources.contact.list.operation.inputFields.find((f) => f.key === "q"),
      ).toBeDefined();
    });
  });

  describe("Oportunidad Resource", () => {
    it("should have correct key and noun", () => {
      expect(resources.oportunidad.key).toBe("oportunidad");
      expect(resources.oportunidad.noun).toBe("Opportunity");
    });

    it("should have list operation with filters", () => {
      expect(resources.oportunidad.list).toBeDefined();
      const fields = resources.oportunidad.list.operation.inputFields;
      expect(fields.find((f) => f.key === "stageId")).toBeDefined();
      expect(fields.find((f) => f.key === "pipelineId")).toBeDefined();
    });
  });

  describe("Pipeline Resource", () => {
    it("should have correct key and noun", () => {
      expect(resources.pipeline.key).toBe("pipeline");
      expect(resources.pipeline.noun).toBe("Pipeline");
    });
  });

  describe("Campaign Resource", () => {
    it("should have correct key and noun", () => {
      expect(resources.campaign.key).toBe("campaign");
      expect(resources.campaign.noun).toBe("Campaign");
    });
  });

  describe("Template Resource", () => {
    it("should have correct key and noun", () => {
      expect(resources.template.key).toBe("template");
      expect(resources.template.noun).toBe("Email Template");
    });
  });
});
