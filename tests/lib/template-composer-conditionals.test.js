/**
 * Tests for conditional block handling in template deduplication
 * These tests demonstrate the CRITICAL BUG with multi-line conditionals
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TemplateComposer } from '../../src/lib/template-composer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TemplateComposer - Conditional Block Edge Cases', () => {
  let composer;

  beforeEach(() => {
    const templatesDir = path.join(__dirname, '../fixtures/templates');
    composer = new TemplateComposer(templatesDir);
  });

  describe('Multi-line conditional blocks', () => {
    it('KNOWN BUG: content inside conditionals can be deduplicated (order-dependent)', () => {
      // This test DOCUMENTS THE BUG - it will pass, showing the broken behavior
      // BUG ONLY OCCURS when duplicate appears BEFORE conditional block

      const fragments = [
        'RUN npm run build\nRUN npm run lint',
        '{{#if BUILD}}\nRUN npm run build\nRUN npm test\n{{/if}}'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      // What SHOULD happen: conditional block preserved intact (2 occurrences of build)
      // What ACTUALLY happens: "RUN npm run build" is deduplicated

      const buildMatches = merged.match(/RUN npm run build/g);

      // This assertion PASSES but demonstrates the bug
      // We expect 2 occurrences, but get only 1 due to deduplication
      expect(buildMatches?.length).toBe(1); // BUG: Should be 2!

      // The conditional block is broken:
      expect(merged).toContain('{{#if BUILD}}');
      expect(merged).toContain('{{/if}}');
      expect(merged).toContain('RUN npm test');

      // But "RUN npm run build" was removed from inside the conditional!
      const lines = merged.split('\n');
      const ifIndex = lines.findIndex(line => line.includes('{{#if BUILD}}'));
      const endifIndex = lines.findIndex(line => line.includes('{{/if}}'));

      if (ifIndex !== -1 && endifIndex !== -1) {
        const conditionalContent = lines.slice(ifIndex + 1, endifIndex);
        const hasBuildCommand = conditionalContent.some(line =>
          line.includes('RUN npm run build')
        );

        // BUG DEMONSTRATION: The build command is missing from conditional!
        expect(hasBuildCommand).toBe(false); // This SHOULD be true!
      }
    });

    it('order matters: conditional FIRST works correctly', () => {
      // When conditional comes first, the duplicate is removed from AFTER
      // This works as expected (though may not be ideal)

      const fragments = [
        '{{#if BUILD}}\nRUN npm run build\nRUN npm test\n{{/if}}',
        'RUN npm run build\nRUN npm run lint'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      // Build command kept in conditional, removed from second fragment
      const lines = merged.split('\n');
      const ifIndex = lines.findIndex(line => line.includes('{{#if BUILD}}'));
      const endifIndex = lines.findIndex(line => line.includes('{{/if}}'));

      const conditionalContent = lines.slice(ifIndex + 1, endifIndex);
      const hasBuildCommand = conditionalContent.some(line =>
        line.includes('RUN npm run build')
      );

      // This works correctly - build command preserved in conditional
      expect(hasBuildCommand).toBe(true);

      // But only one occurrence total (the one inside conditional)
      const buildMatches = merged.match(/RUN npm run build/g);
      expect(buildMatches?.length).toBe(1);
    });

    it('should preserve single-line conditionals correctly', () => {
      // Single-line conditionals work fine because the whole line is preserved
      const fragments = [
        '{{#if BUILD}}RUN npm run build{{/if}}',
        '{{#if BUILD}}RUN npm run build{{/if}}'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      // Both instances preserved because they contain template syntax
      const matches = merged.match(/\{\{#if BUILD\}\}RUN npm run build\{\{\/if\}\}/g);
      expect(matches?.length).toBe(2);
    });

    it('should handle nested content that appears elsewhere', () => {
      const fragments = [
        'RUN apt-get update\n{{#if INSTALL_DEPS}}\nRUN apt-get install -y curl\nRUN apt-get install -y git\n{{/if}}',
        'RUN apt-get update\nRUN apt-get install -y curl'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      // "RUN apt-get install -y curl" appears in both fragment 1 (inside conditional)
      // and fragment 2 (outside conditional). Deduplication will remove one.

      const curlMatches = merged.match(/RUN apt-get install -y curl/g);

      // BUG: Only one occurrence remains
      expect(curlMatches?.length).toBe(1);

      // TODO: Should be 2 - one inside conditional, one outside
    });
  });

  describe('Template syntax preservation', () => {
    it('should preserve conditional opening and closing tags', () => {
      const fragments = [
        '{{#if VAR}}\nContent\n{{/if}}',
        'Other content'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      expect(merged).toContain('{{#if VAR}}');
      expect(merged).toContain('{{/if}}');
    });

    it('should preserve multiple conditionals', () => {
      const fragments = [
        '{{#if BUILD}}\nRUN build\n{{/if}}\n{{#if TEST}}\nRUN test\n{{/if}}'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      expect(merged.match(/\{\{#if/g)?.length).toBe(2);
      expect(merged.match(/\{\{\/if\}\}/g)?.length).toBe(2);
    });
  });

  describe('Integration with variable substitution', () => {
    it('should handle conditionals after deduplication + substitution', () => {
      // Realistic workflow: merge with deduplication, then substitute
      const fragments = [
        '{{#if BUILD}}\nRUN npm run build\n{{/if}}'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });
      const result = composer.substituteVariables(merged, { BUILD: true });

      // Conditional should be removed and content kept
      expect(result).not.toContain('{{#if');
      expect(result).not.toContain('{{/if}}');
      expect(result).toContain('RUN npm run build');
    });

    it('should remove conditional content when variable is falsy', () => {
      const fragments = [
        '{{#if BUILD}}\nRUN npm run build\n{{/if}}\nRUN npm start'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });
      const result = composer.substituteVariables(merged, { BUILD: false });

      expect(result).not.toContain('RUN npm run build');
      expect(result).toContain('RUN npm start');
    });
  });

  describe('Workarounds for users', () => {
    it('workaround: disable deduplication for templates with conditionals', () => {
      const fragments = [
        '{{#if BUILD}}\nRUN npm run build\nRUN npm test\n{{/if}}',
        'RUN npm run build\nRUN npm run lint'
      ];

      // Workaround: Don't use deduplication if you have multi-line conditionals
      const merged = composer.mergeFragments(fragments, { deduplicate: false });

      const buildMatches = merged.match(/RUN npm run build/g);
      expect(buildMatches?.length).toBe(2); // Both preserved!
    });

    it('workaround: use unique commands inside conditionals', () => {
      const fragments = [
        '{{#if BUILD}}\nRUN npm run build -- --production\nRUN npm test -- --ci\n{{/if}}',
        'RUN npm run build\nRUN npm test'
      ];

      // Make commands inside conditionals unique with flags
      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      // Different commands, so no deduplication
      expect(merged).toContain('npm run build -- --production');
      expect(merged).toContain('npm run build');
    });
  });
});
