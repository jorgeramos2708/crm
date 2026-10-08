const triggers = require("../triggers");

describe("Triggers Module Load", () => {
  it("should load triggers module", () => {
    console.log("=== TRIGGERS MODULE LOADED ===");
    console.log("triggers type:", typeof triggers);
    console.log("triggers keys:", Object.keys(triggers));
    expect(typeof triggers).toBe("object");
    expect(Object.keys(triggers).length).toBeGreaterThan(0);
  });
});

describe("Triggers", () => {
  const triggers = require("../triggers");

  afterEach(() => {
    // nock.cleanAll();
  });

  describe("New Contact Trigger", () => {
    it("should have correct key and display", () => {
      expect(triggers.new_contact.key).toBe("new_contact");
      expect(triggers.new_contact.noun).toBe("Contact");
      expect(triggers.new_contact.display.label).toBe("New Contact");
      expect(triggers.new_contact.display.description).toBe(
        "Triggers when a new contact is created.",
      );
    });

    it("should have subscribe and unsubscribe methods", () => {
      expect(triggers.new_contact.operation.performSubscribe).toBeDefined();
      expect(triggers.new_contact.operation.performUnsubscribe).toBeDefined();
    });

    it("should have perform method", () => {
      expect(triggers.new_contact.operation.perform).toBeDefined();
    });

    it("should have sample data", () => {
      expect(triggers.new_contact.sample).toBeDefined();
      expect(triggers.new_contact.sample.id).toBeDefined();
      expect(triggers.new_contact.sample.nombre).toBeDefined();
    });
  });

  describe("New Opportunity Trigger", () => {
    it("should have correct key and display", () => {
      expect(triggers.new_oportunidad.key).toBe("new_oportunidad");
      expect(triggers.new_oportunidad.noun).toBe("Opportunity");
      expect(triggers.new_oportunidad.display.label).toBe("New Opportunity");
      expect(triggers.new_oportunidad.display.description).toBe(
        "Triggers when a new opportunity is created.",
      );
    });

    it("should have subscribe and unsubscribe methods", () => {
      expect(triggers.new_oportunidad.operation.performSubscribe).toBeDefined();
      expect(
        triggers.new_oportunidad.operation.performUnsubscribe,
      ).toBeDefined();
    });
  });

  describe("Stage Changed Trigger", () => {
    it("should have correct key and display", () => {
      expect(triggers.stage_changed.key).toBe("stage_changed");
      expect(triggers.stage_changed.noun).toBe("Opportunity Stage");
      expect(triggers.stage_changed.display.label).toBe("Stage Changed");
      expect(triggers.stage_changed.display.description).toBe(
        "Triggers when an opportunity stage changes.",
      );
    });

    it("should have subscribe and unsubscribe methods", () => {
      expect(triggers.stage_changed.operation.performSubscribe).toBeDefined();
      expect(triggers.stage_changed.operation.performUnsubscribe).toBeDefined();
    });
  });

  describe("Email Opened Trigger", () => {
    it("should have correct key and display", () => {
      expect(triggers.email_opened.key).toBe("email_opened");
      expect(triggers.email_opened.noun).toBe("Email Open");
      expect(triggers.email_opened.display.label).toBe("Email Opened");
      expect(triggers.email_opened.display.description).toBe(
        "Triggers when a tracked email is opened.",
      );
    });

    it("should have subscribe and unsubscribe methods", () => {
      expect(triggers.email_opened.operation.performSubscribe).toBeDefined();
      expect(triggers.email_opened.operation.performUnsubscribe).toBeDefined();
    });
  });
});
