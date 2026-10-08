#!/usr/bin/env node

/**
 * Accessibility Audit Script
 * Runs axe-core accessibility checks on key pages
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Dashboard', path: '/' },
  { name: 'Contactos', path: '/contactos' },
  { name: 'Pipeline', path: '/pipeline' },
  { name: 'Settings', path: '/settings' },
]

async function runAccessibilityAudit() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const results = []
  
  for (const { name, path } of PAGES) {
    console.log(`\n🔍 Auditing ${name} (${path})...`)
    
    try {
      await page.goto(`http://localhost:8081${path}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Wait for page to be interactive
      await page.waitForLoadState('networkidle')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze()
      
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`❌ ${name}: ${accessibilityScanResults.violations.length} violations found`)
        
        for (const violation of accessibilityScanResults.violations) {
          console.log(`  ⚠️  [${violation.impact}] ${violation.id}: ${violation.description}`)
          console.log(`     Help: ${violation.helpUrl}`)
          if (violation.nodes.length > 0) {
            console.log(`     Elements: ${violation.nodes.length} affected`)
          }
        }
        results.push({ name, path, violations: accessibilityScanResults.violations, passed: false })
      } else {
        console.log(`✅ ${name}: No accessibility violations`)
        results.push({ name, path, violations: [], passed: true })
      }
    } catch (error) {
      console.log(`❌ ${name}: Error during audit - ${error.message}`)
      results.push({ name, path, violations: [], passed: false, error: error.message })
    }
  }
  
  await browser.close()
  
  // Summary
  console.log('\n📊 Accessibility Audit Summary')
  console.log('='.repeat(50))
  
  const totalPages = results.length
  const passedPages = results.filter(r => r.passed).length
  const failedPages = results.filter(r => !r.passed).length
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0)
  
  console.log(`Pages tested: ${totalPages}`)
  console.log(`Passed: ${passedPages}`)
  console.log(`Failed: ${failedPages}`)
  console.log(`Total violations: ${totalViolations}`)
  
  if (failedPages > 0) {
    console.log('\n❌ Accessibility audit FAILED')
    process.exit(1)
  } else {
    console.log('\n✅ Accessibility audit PASSED')
    process.exit(0)
  }
}

runAccessibilityAudit().catch(console.error)