import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { LeadScoringService } from "../services/leadScoring.js";
import { LeadScoringEngine } from "../services/leadScoring.js";

export async function registerLeadScoringRoutes(app: FastifyInstance) {
  // Lead Scoring Rules
  app.get("/api/lead-scoring/rules", async (req: FastifyRequest) => {
    return LeadScoringService.listRuleSets(req.tenantId ?? "default");
  });

  app.post(
    "/api/lead-scoring/rules",
    async (req: FastifyRequest, res: FastifyReply) => {
      const body = req.body as {
        nombre: string;
        descripcion?: string;
        reglas: Array<{
          campo: string;
          operador: string;
          valor: any;
          puntos: number;
        }>;
        activo?: boolean;
      };
      const ruleSet = await LeadScoringService.createRuleSet({
        tenantId: req.tenantId ?? "default",
        userId: req.user!.id,
        nombre: body.nombre,
        descripcion: body.descripcion,
        reglas: body.reglas,
        activo: body.activo,
      });
      return res.code(201).send(ruleSet);
    },
  );

  app.get(
    "/api/lead-scoring/rules/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      res: FastifyReply,
    ) => {
      const ruleSets = await LeadScoringService.listRuleSets(
        req.tenantId ?? "default",
      );
      const rule = ruleSets.find((r) => r.id === req.params.id);
      if (!rule) return res.code(404).send({ error: "No encontrado" });
      return rule;
    },
  );

  app.put(
    "/api/lead-scoring/rules/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      res: FastifyReply,
    ) => {
      const body = req.body as Partial<{
        nombre: string;
        descripcion: string;
        reglas: any[];
        activo: boolean;
      }>;
      const ruleSet = await LeadScoringService.updateSchedule(
        req.params.id,
        body,
      );
      if (!ruleSet) return res.code(404).send({ error: "No encontrado" });
      return ruleSet;
    },
  );

  app.delete(
    "/api/lead-scoring/rules/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      res: FastifyReply,
    ) => {
      await LeadScoringService.deleteRuleSet(req.params.id);
      return { ok: true };
    },
  );

  app.post(
    "/api/lead-scoring/evaluate/:contactoId",
    async (req: FastifyRequest<{ Params: { contactoId: string } }>) => {
      const score = await LeadScoringEngine.evaluateContact(
        req.params.contactoId,
        req.tenantId ?? "default",
      );
      return { score };
    },
  );

  app.post("/api/lead-scoring/recalculate", async (req) => {
    const result = await LeadScoringService.recalculateAllScores(
      req.tenantId ?? "default",
    );
    return result;
  });
}
