/**
 * Fragment Merger
 *
 * Merges Docker template fragments into base templates.
 * Handles conflict resolution and variable substitution.
 *
 * @module templates/fragments/fragment-merger
 */

import { InsertionPoint } from './fragment-types.js';

/**
 * FragmentMerger - Merges fragments with conflict resolution
 */
export class FragmentMerger {
  constructor() {
    this.insertionPoints = new Map();
    this.variables = new Map();
    this.mergedContent = '';
  }

  /**
   * Merges a fragment into base template
   *
   * @param {string} baseTemplate - Base template content
   * @param {string} fragmentContent - Fragment to merge
   * @param {Object} metadata - Fragment metadata
   * @returns {string} Merged template
   *
   * @example
   * const merger = new FragmentMerger();
   * const result = merger.merge(baseTemplate, fragment, metadata);
   */
  merge(baseTemplate, fragmentContent, metadata) {
    const insertionPoint = metadata.insertionPoint;
    const marker = `# ${insertionPoint}`;

    // Find insertion point in base template
    const markerIndex = baseTemplate.indexOf(marker);

    if (markerIndex === -1) {
      throw new Error(`Insertion point ${insertionPoint} not found in base template`);
    }

    // Find the end of the line containing the marker
    const lineEndIndex = baseTemplate.indexOf('\n', markerIndex);
    const insertPosition = lineEndIndex !== -1 ? lineEndIndex + 1 : baseTemplate.length;

    // Prepare fragment content (remove insertion point comment from fragment)
    const cleanedFragment = this.cleanFragmentContent(fragmentContent, metadata);

    // Insert fragment after the marker line
    const before = baseTemplate.substring(0, insertPosition);
    const after = baseTemplate.substring(insertPosition);

    return before + '\n' + cleanedFragment + '\n' + after;
  }

  /**
   * Merges multiple fragments in priority order
   *
   * @param {string} baseTemplate - Base template content
   * @param {Array} fragments - Array of {content, metadata} objects
   * @returns {string} Merged template
   */
  mergeMultiple(baseTemplate, fragments) {
    // Group fragments by insertion point first
    const fragmentsByPoint = new Map();
    fragments.forEach(({ content, metadata }) => {
      const point = metadata.insertionPoint;
      if (!fragmentsByPoint.has(point)) {
        fragmentsByPoint.set(point, []);
      }
      fragmentsByPoint.get(point).push({ content, metadata });
    });

    // Sort each group by priority (higher priority first)
    fragmentsByPoint.forEach((frags, point) => {
      frags.sort((a, b) => {
        const priorityA = a.metadata.priority || 0;
        const priorityB = b.metadata.priority || 0;
        return priorityB - priorityA;
      });
    });

    // Merge each group - combine all fragments for same insertion point
    let result = baseTemplate;
    fragmentsByPoint.forEach((frags, insertionPoint) => {
      const marker = `# ${insertionPoint}`;
      const markerIndex = result.indexOf(marker);

      if (markerIndex === -1) {
        throw new Error(`Insertion point ${insertionPoint} not found in base template`);
      }

      // Find the end of the line containing the marker
      const lineEndIndex = result.indexOf('\n', markerIndex);
      const insertPosition = lineEndIndex !== -1 ? lineEndIndex + 1 : result.length;

      // Combine all fragments for this insertion point (already sorted by priority)
      const cleanedFragments = frags.map(({ content, metadata }) =>
        this.cleanFragmentContent(content, metadata)
      );
      const combinedContent = cleanedFragments.join('\n');

      // Insert combined content after the marker line
      const before = result.substring(0, insertPosition);
      const after = result.substring(insertPosition);
      result = before + '\n' + combinedContent + '\n' + after;
    });

    return result;
  }

  /**
   * Merges docker-compose service fragments
   *
   * @param {string} baseCompose - Base docker-compose.yml content
   * @param {string[]} serviceFragments - Service fragment contents
   * @returns {string} Merged docker-compose.yml
   */
  mergeComposeServices(baseCompose, serviceFragments) {
    const marker = '# DATABASE_SERVICES';
    const volumesMarker = '# VOLUMES';

    let result = baseCompose;

    // Find or create services section
    const servicesIndex = result.indexOf('services:');
    if (servicesIndex === -1) {
      throw new Error('Base docker-compose.yml must have a services section');
    }

    // Merge each service fragment
    serviceFragments.forEach(fragment => {
      // Extract service definitions (everything except volumes)
      const volumesStart = fragment.indexOf('volumes:');
      const serviceContent = volumesStart !== -1
        ? fragment.substring(0, volumesStart).trim()
        : fragment.trim();

      // Insert service content
      const markerIndex = result.indexOf(marker);
      if (markerIndex !== -1) {
        const lineEndIndex = result.indexOf('\n', markerIndex);
        const insertPosition = lineEndIndex !== -1 ? lineEndIndex + 1 : result.length;

        const before = result.substring(0, insertPosition);
        const after = result.substring(insertPosition);
        result = before + '\n' + serviceContent + '\n' + after;
      }

      // Extract and merge volumes if present
      if (volumesStart !== -1) {
        const volumeContent = fragment.substring(volumesStart).trim();
        const volumesMarkerIndex = result.indexOf(volumesMarker);

        if (volumesMarkerIndex !== -1) {
          const lineEndIndex = result.indexOf('\n', volumesMarkerIndex);
          const insertPosition = lineEndIndex !== -1 ? lineEndIndex + 1 : result.length;

          const before = result.substring(0, insertPosition);
          const after = result.substring(insertPosition);

          // Extract just the volume definitions (skip the 'volumes:' line)
          const volumeLines = volumeContent.split('\n').slice(1).join('\n');
          result = before + '\n' + volumeLines + '\n' + after;
        }
      }
    });

    return result;
  }

  /**
   * Cleans fragment content by removing metadata comments
   *
   * @param {string} content - Fragment content
   * @param {Object} metadata - Fragment metadata
   * @returns {string} Cleaned content
   */
  cleanFragmentContent(content, metadata) {
    // Remove insertion point comment lines
    const lines = content.split('\n');
    const cleaned = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('# Insertion Point:') &&
             !trimmed.includes('Fragment') ||
             trimmed.startsWith('# FRAMEWORK_') ||
             trimmed.startsWith('# BACKEND_') ||
             trimmed.startsWith('# DATABASE_');
    });

    return cleaned.join('\n');
  }

  /**
   * Substitutes variables in template
   *
   * @param {string} template - Template with {{VAR}} placeholders
   * @param {Object} variables - Variable values
   * @returns {string} Template with substituted variables
   */
  substituteVariables(template, variables) {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, value);
    });

    return result;
  }

  /**
   * Detects and resolves conflicts between fragments
   *
   * @param {Array} fragments - Array of fragment metadata
   * @returns {Object} Conflict resolution result
   */
  detectConflicts(fragments) {
    const conflicts = [];
    const resolutions = [];

    // Check for port conflicts
    const ports = new Map();
    fragments.forEach(({ metadata, content }) => {
      const portMatches = content.matchAll(/{{(\w*PORT\w*)}}/g);
      for (const match of portMatches) {
        const portVar = match[1];
        if (ports.has(portVar)) {
          conflicts.push({
            type: 'port',
            fragments: [ports.get(portVar), metadata.name],
            variable: portVar
          });
        } else {
          ports.set(portVar, metadata.name);
        }
      }
    });

    // Check for duplicate service names (docker-compose)
    const services = new Map();
    fragments.forEach(({ metadata, content }) => {
      if (metadata.type === 'database') {
        const serviceMatches = content.matchAll(/^\s{2}(\w+):/gm);
        for (const match of serviceMatches) {
          const serviceName = match[1];
          if (services.has(serviceName)) {
            conflicts.push({
              type: 'service_name',
              fragments: [services.get(serviceName), metadata.name],
              service: serviceName
            });
          } else {
            services.set(serviceName, metadata.name);
          }
        }
      }
    });

    // Generate auto-resolutions
    conflicts.forEach(conflict => {
      if (conflict.type === 'port') {
        resolutions.push({
          conflict,
          resolution: `Use different variable names: ${conflict.variable}_${conflict.fragments[1].toUpperCase()}`
        });
      } else if (conflict.type === 'service_name') {
        resolutions.push({
          conflict,
          resolution: `Rename service to: ${conflict.service}_${conflict.fragments[1]}`
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolutions
    };
  }

  /**
   * Extracts all variables used in a template
   *
   * @param {string} template - Template content
   * @returns {Set} Set of variable names
   */
  extractVariables(template) {
    const variables = new Set();
    const pattern = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
    let match;

    while ((match = pattern.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return variables;
  }
}

export default FragmentMerger;
