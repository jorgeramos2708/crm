import { describe, it, expect } from 'vitest'
import { evaluateCondition, evaluateConditions, renderTemplate } from '../services/automatizaciones.js'

describe('Automatizaciones Service', () => {
  describe('evaluateCondition', () => {
    it('should evaluate equals correctly', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Ganado' } }
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'equals', valor: 'Ganado' }, context)).toBe(true)
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'equals', valor: 'Perdido' }, context)).toBe(false)
    })

    it('should evaluate not_equals correctly', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Ganado' } }
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'not_equals', valor: 'Perdido' }, context)).toBe(true)
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'not_equals', valor: 'Ganado' }, context)).toBe(false)
    })

    it('should evaluate contains correctly', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Negociación Avanzada' } }
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'contains', valor: 'Negociación' }, context)).toBe(true)
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'contains', valor: 'Ganado' }, context)).toBe(false)
    })

    it('should evaluate greater_than correctly', () => {
      const context = { evento: 'stage_changed', importe: 10000 }
      expect(evaluateCondition({ campo: 'importe', operador: 'greater_than', valor: 5000 }, context)).toBe(true)
      expect(evaluateCondition({ campo: 'importe', operador: 'greater_than', valor: 15000 }, context)).toBe(false)
    })

    it('should evaluate less_than correctly', () => {
      const context = { evento: 'stage_changed', probabilidad: 25 }
      expect(evaluateCondition({ campo: 'probabilidad', operador: 'less_than', valor: 50 }, context)).toBe(true)
      expect(evaluateCondition({ campo: 'probabilidad', operador: 'less_than', valor: 10 }, context)).toBe(false)
    })

    it('should evaluate in correctly', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Ganado' } }
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'in', valor: ['Ganado', 'Perdido'] }, context)).toBe(true)
      expect(evaluateCondition({ campo: 'stage.nombre', operador: 'in', valor: ['Propuesta', 'Negociación'] }, context)).toBe(false)
    })

    it('should handle nested object paths', () => {
      const context = { evento: 'stage_changed', oportunidad: { stageId: 'abc-123', pipelineId: 'xyz-789' } }
      expect(evaluateCondition({ campo: 'oportunidad.stageId', operador: 'equals', valor: 'abc-123' }, context)).toBe(true)
    })

    it('should return false for missing paths', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Ganado' } }
      expect(evaluateCondition({ campo: 'stage.inexistente', operador: 'equals', valor: 'algo' }, context)).toBe(false)
    })
  })

  describe('evaluateConditions', () => {
    it('should return true for empty conditions', () => {
      const context = { evento: 'test' }
      expect(evaluateConditions([], context)).toBe(true)
      expect(evaluateConditions(null, context)).toBe(true)
      expect(evaluateConditions(undefined, context)).toBe(true)
    })

    it('should require all conditions to match (AND logic)', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Ganado', esFinal: true }, importe: 10000 }
      const conditions = [
        { campo: 'stage.nombre', operador: 'equals', valor: 'Ganado' },
        { campo: 'stage.esFinal', operador: 'equals', valor: true },
        { campo: 'importe', operador: 'greater_than', valor: 5000 },
      ]
      expect(evaluateConditions(conditions, context)).toBe(true)
    })

    it('should return false if any condition fails', () => {
      const context = { evento: 'stage_changed', stage: { nombre: 'Ganado', esFinal: true }, importe: 10000 }
      const conditions = [
        { campo: 'stage.nombre', operador: 'equals', valor: 'Ganado' },
        { campo: 'importe', operador: 'greater_than', valor: 15000 }, // fails
      ]
      expect(evaluateConditions(conditions, context)).toBe(false)
    })
  })

  describe('renderTemplate', () => {
    it('should replace variables correctly', () => {
      const template = 'Hola {{nombre}}, bienvenido a {{empresa}}'
      const data = { nombre: 'Juan', empresa: 'Acme Inc' }
      expect(renderTemplate(template, data)).toBe('Hola Juan, bienvenido a Acme Inc')
    })

    it('should handle missing variables', () => {
      const template = 'Hola {{nombre}}, tu código es {{codigo}}'
      const data = { nombre: 'Juan' }
      expect(renderTemplate(template, data)).toBe('Hola Juan, tu código es ')
    })

    it('should handle empty template', () => {
      expect(renderTemplate('', {})).toBe('')
    })

    it('should handle no variables', () => {
      expect(renderTemplate('Hola mundo', { nombre: 'Juan' })).toBe('Hola mundo')
    })
  })
})