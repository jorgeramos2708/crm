import { db } from "../db/index.js";
import { meetingTypes, meetingSlots, users, tenants } from "../db/schema.js";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendEmail } from "./email.js";

export interface MeetingTypeConfig {
  nombre: string;
  descripcion?: string;
  duracionMin: number;
  bufferAntesMin?: number;
  bufferDespuesMin?: number;
  diasAntelacionMin?: number;
  diasAntelacionMax?: number;
  zonaHoraria?: string;
  preguntas?: Array<{
    label: string;
    type: "text" | "email" | "phone" | "textarea";
    required: boolean;
  }>;
  slug: string;
}

export interface SlotConfig {
  meetingTypeId: string;
  inicio: Date;
  fin: Date;
}

export class MeetingSchedulerService {
  static async createMeetingType(
    config: MeetingTypeConfig,
    userId: string,
    tenantId: string,
  ) {
    const [meetingType] = await db
      .insert(meetingTypes)
      .values({
        tenantId,
        userId,
        nombre: config.nombre,
        descripcion: config.descripcion,
        duracionMin: config.duracionMin,
        bufferAntesMin: config.bufferAntesMin ?? 5,
        bufferDespuesMin: config.bufferDespuesMin ?? 5,
        diasAntelacionMin: config.diasAntelacionMin ?? 1,
        diasAntelacionMax: config.diasAntelacionMax ?? 60,
        zonaHoraria: config.zonaHoraria ?? "UTC",
        preguntas: config.preguntas ?? [],
        slug: config.slug,
        activo: true,
      })
      .returning();
    return meetingType;
  }

  static async updateMeetingType(
    id: string,
    data: Partial<{
      nombre: string;
      descripcion: string;
      duracionMin: number;
      bufferAntesMin: number;
      bufferDespuesMin: number;
      diasAntelacionMin: number;
      diasAntelacionMax: number;
      zonaHoraria: string;
      preguntas: Array<{ label: string; type: string; required: boolean }>;
      activo: boolean;
    }>,
  ) {
    const [meetingType] = await db
      .update(meetingTypes)
      .set({ ...data, actualizadoEn: new Date() })
      .where(eq(meetingTypes.id, id))
      .returning();
    return meetingType || null;
  }

  static async deleteMeetingType(id: string) {
    await db.delete(meetingTypes).where(eq(meetingTypes.id, id));
    return { ok: true };
  }

  static async listMeetingTypes(
    tenantId: string,
    userId?: string,
    soloActivos = false,
  ) {
    const conditions = [eq(meetingTypes.tenantId, tenantId)];
    if (userId) conditions.push(eq(meetingTypes.userId, userId));
    if (soloActivos) conditions.push(eq(meetingTypes.activo, true));

    return db
      .select()
      .from(meetingTypes)
      .where(and(...conditions))
      .orderBy(desc(meetingTypes.creadoEn));
  }

  static async getMeetingTypeBySlug(slug: string) {
    const [meetingType] = await db
      .select()
      .from(meetingTypes)
      .where(eq(meetingTypes.slug, slug))
      .limit(1);
    return meetingType || null;
  }

  static async getMeetingType(id: string) {
    const [meetingType] = await db
      .select()
      .from(meetingTypes)
      .where(eq(meetingTypes.id, id))
      .limit(1);
    return meetingType || null;
  }

  // Slot generation
  static async generateSlots(config: SlotConfig, daysAhead = 60) {
    const [meetingType] = await db
      .select()
      .from(meetingTypes)
      .where(eq(meetingTypes.id, config.meetingTypeId))
      .limit(1);

    if (!meetingType || !meetingType.activo) {
      throw new Error("Meeting type not found or inactive");
    }

    const {
      duracionMin,
      bufferAntesMin,
      bufferDespuesMin,
      diasAntelacionMin,
      diasAntelacionMax,
      zonaHoraria,
    } = meetingType;

    // Check for existing slots
    const existingSlots = await db
      .select()
      .from(meetingSlots)
      .where(
        and(
          eq(meetingSlots.meetingTypeId, config.meetingTypeId),
          gte(meetingSlots.inicio, config.inicio),
          lte(meetingSlots.inicio, config.fin),
        ),
      );

    const existingSet = new Set(
      existingSlots.map(
        (s) => s.inicio.toISOString() + "|" + s.fin.toISOString(),
      ),
    );

    const slotsToCreate = [];
    const start = new Date(config.inicio);
    const end = new Date(config.fin);

    // Get user's calendar (if connected) to check availability
    // For now, generate all slots based on duration and buffers

    let current = new Date(start);
    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + duracionMin * 60 * 1000);

      const key = slotStart.toISOString() + "|" + slotEnd.toISOString();
      if (!existingSet.has(key)) {
        slotsToCreate.push({
          meetingTypeId: config.meetingTypeId,
          inicio: slotStart,
          fin: slotEnd,
          estado: "disponible",
        });
      }

      current = new Date(
        current.getTime() +
          (duracionMin + (bufferAntesMin ?? 0) + (bufferDespuesMin ?? 0)) *
            60 *
            1000,
      );
    }

    if (slotsToCreate.length > 0) {
      await db.insert(meetingSlots).values(slotsToCreate);
    }

    return { created: slotsToCreate.length };
  }

  static async getAvailableSlots(
    meetingTypeId: string,
    fromDate: Date,
    toDate: Date,
  ) {
    return db
      .select()
      .from(meetingSlots)
      .where(
        and(
          eq(meetingSlots.meetingTypeId, meetingTypeId),
          eq(meetingSlots.estado, "disponible"),
          gte(meetingSlots.inicio, fromDate),
          lte(meetingSlots.inicio, toDate),
        ),
      )
      .orderBy(asc(meetingSlots.inicio));
  }

  static async bookSlot(
    slotId: string,
    bookingData: {
      invitadoNombre: string;
      invitadoEmail: string;
      invitadoTelefono?: string;
      respuestas?: Record<string, any>;
    },
  ) {
    const [slot] = await db
      .select()
      .from(meetingSlots)
      .where(eq(meetingSlots.id, slotId))
      .limit(1);

    if (!slot || slot.estado !== "disponible") {
      throw new Error("Slot no disponible");
    }

    const [updated] = await db
      .update(meetingSlots)
      .set({
        ...bookingData,
        estado: "reservado",
        reservadoPor: sql`null`, // será llenado si hay usuario logueado
        actualizadoEn: new Date(),
      })
      .where(eq(meetingSlots.id, slotId))
      .returning();

    // Get meeting type for email
    const [meetingType] = await db
      .select()
      .from(meetingTypes)
      .where(
        eq(
          meetingTypes.id,
          (
            await db
              .select({ meetingTypeId: meetingSlots.meetingTypeId })
              .from(meetingSlots)
              .where(eq(meetingSlots.id, slotId))
              .limit(1)
          )[0]?.meetingTypeId,
        ),
      )
      .limit(1);

    // Send confirmation email
    if (meetingType) {
      const [owner] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, meetingType.userId))
        .limit(1);

      await sendEmail({
        to: slot.invitadoEmail ?? "",
        subject: `Confirmación: ${meetingType.nombre}`,
        html: `
          <p>Hola ${slot.invitadoNombre},</p>
          <p>Tu reunión <strong>${meetingType.nombre}</strong> ha sido confirmada.</p>
          <p><strong>Fecha:</strong> ${new Date(slot.inicio).toLocaleString()}</p>
          <p><strong>Duración:</strong> ${meetingType.duracionMin} minutos</p>
          <p>Nos vemos pronto,<br>${owner?.name ?? "El equipo"}</p>
        `,
        text: `Confirmación: ${meetingType.nombre} - ${new Date(slot.inicio).toLocaleString()}`,
      });

      // Notify owner
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: `Nueva reserva: ${meetingType.nombre}`,
          html: `<p>${slot.invitadoNombre} (${slot.invitadoEmail}) ha reservado ${meetingType.nombre} para el ${new Date(slot.inicio).toLocaleString()}.</p>`,
        });
      }
    }

    return updated;
  }

  static async cancelSlot(slotId: string) {
    const [slot] = await db
      .update(meetingSlots)
      .set({ estado: "cancelado", actualizadoEn: new Date() })
      .where(eq(meetingSlots.id, slotId))
      .returning();
    return slot;
  }

  static async getUserBookings(userId: string) {
    return db
      .select()
      .from(meetingSlots)
      .where(eq(meetingSlots.reservadoPor, userId))
      .orderBy(asc(meetingSlots.inicio));
  }
}
