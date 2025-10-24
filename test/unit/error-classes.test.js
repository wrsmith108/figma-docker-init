/**
 * Test: Error Classes Comprehensive
 * Purpose: Cover ValidationError and ConfigError usage throughout codebase
 * Coverage Target: Complete coverage of error throwing paths
 */

import {
  ValidationError,
  ConfigError,
  sanitizeString,
  validateTemplateName,
  validateProjectDirectory,
  validatePort,
  validateProjectName,
  validateFilePath
} from '../../figma-docker-init.js';

describe('Error Classes - Comprehensive Usage', () => {
  describe('ValidationError Construction', () => {
    it('should create ValidationError with message', () => {
      const error = new ValidationError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('ValidationError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create ValidationError with empty message', () => {
      const error = new ValidationError('');
      expect(error.message).toBe('');
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with long message', () => {
      const longMsg = 'a'.repeat(1000);
      const error = new ValidationError(longMsg);
      expect(error.message).toBe(longMsg);
    });
  });

  describe('ConfigError Construction', () => {
    it('should create ConfigError with message', () => {
      const error = new ConfigError('Config error');
      expect(error.message).toBe('Config error');
      expect(error.name).toBe('ConfigError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create ConfigError with empty message', () => {
      const error = new ConfigError('');
      expect(error.message).toBe('');
      expect(error.name).toBe('ConfigError');
    });
  });

  describe('ValidationError in sanitizeString', () => {
    it('should throw for non-string types', () => {
      expect(() => sanitizeString(123)).toThrow(ValidationError);
      expect(() => sanitizeString(true)).toThrow(ValidationError);
      expect(() => sanitizeString({})).toThrow(ValidationError);
      expect(() => sanitizeString([])).toThrow(ValidationError);
      expect(() => sanitizeString(null)).toThrow(ValidationError);
      expect(() => sanitizeString(undefined)).toThrow(ValidationError);
    });

    it('should throw with specific message for non-string', () => {
      try {
        sanitizeString(123);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Input must be a string');
      }
    });

    it('should throw for strings exceeding maxLength', () => {
      const longString = 'a'.repeat(256);
      expect(() => sanitizeString(longString)).toThrow(ValidationError);
    });

    it('should throw with specific message for maxLength', () => {
      const longString = 'a'.repeat(256);
      try {
        sanitizeString(longString);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('exceeds maximum length');
      }
    });
  });

  describe('ValidationError in validateTemplateName', () => {
    it('should throw for invalid characters', () => {
      expect(() => validateTemplateName('template with spaces')).toThrow(ValidationError);
      expect(() => validateTemplateName('template@special')).toThrow(ValidationError);
      expect(() => validateTemplateName('template#hashtag')).toThrow(ValidationError);
      expect(() => validateTemplateName('template$dollar')).toThrow(ValidationError);
    });

    it('should throw with specific message', () => {
      try {
        validateTemplateName('invalid name');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('invalid characters');
        expect(error.message).toContain('alphanumeric');
      }
    });
  });

  describe('ValidationError in validateProjectDirectory', () => {
    it('should throw for directory traversal', () => {
      expect(() => validateProjectDirectory('..')).toThrow(ValidationError);
      expect(() => validateProjectDirectory('../..')).toThrow(ValidationError);
      expect(() => validateProjectDirectory('../../etc')).toThrow(ValidationError);
    });

    it('should throw with specific message for traversal', () => {
      try {
        validateProjectDirectory('..');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('current working directory');
      }
    });

    it('should throw for absolute paths outside cwd', () => {
      expect(() => validateProjectDirectory('/tmp')).toThrow(ValidationError);
      expect(() => validateProjectDirectory('/etc')).toThrow(ValidationError);
    });
  });

  describe('ValidationError in validatePort', () => {
    it('should throw for invalid port numbers', () => {
      expect(() => validatePort(0)).toThrow(ValidationError);
      expect(() => validatePort(-1)).toThrow(ValidationError);
      expect(() => validatePort(65536)).toThrow(ValidationError);
      expect(() => validatePort(70000)).toThrow(ValidationError);
      expect(() => validatePort('invalid')).toThrow(ValidationError);
      expect(() => validatePort(NaN)).toThrow(ValidationError);
    });

    it('should throw with specific message', () => {
      try {
        validatePort(0);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('between 1 and 65535');
      }
    });
  });

  describe('ValidationError in validateProjectName', () => {
    it('should throw for invalid project names', () => {
      expect(() => validateProjectName('name with spaces')).toThrow(ValidationError);
      expect(() => validateProjectName('name@special')).toThrow(ValidationError);
      expect(() => validateProjectName('name#tag')).toThrow(ValidationError);
    });

    it('should throw with specific message', () => {
      try {
        validateProjectName('invalid name');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('invalid characters');
      }
    });
  });

  describe('ValidationError in validateFilePath', () => {
    const baseDir = process.cwd();

    it('should throw for directory traversal', () => {
      expect(() => validateFilePath('../etc/passwd', baseDir)).toThrow(ValidationError);
      expect(() => validateFilePath('../../etc/passwd', baseDir)).toThrow(ValidationError);
    });

    it('should throw with specific message', () => {
      try {
        validateFilePath('../etc/passwd', baseDir);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('outside allowed directory');
      }
    });

    it('should throw for absolute paths outside baseDir', () => {
      expect(() => validateFilePath('/etc/passwd', baseDir)).toThrow(ValidationError);
    });
  });

  describe('Error Stack Traces', () => {
    it('ValidationError should have stack trace', () => {
      const error = new ValidationError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });

    it('ConfigError should have stack trace', () => {
      const error = new ConfigError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ConfigError');
    });
  });

  describe('Error Catching', () => {
    it('ValidationError can be caught with try-catch', () => {
      let caught = false;
      try {
        validatePort(0);
      } catch (error) {
        caught = true;
        expect(error).toBeInstanceOf(ValidationError);
      }
      expect(caught).toBe(true);
    });

    it('ValidationError can be checked with instanceof', () => {
      try {
        validateTemplateName('bad name');
      } catch (error) {
        expect(error instanceof ValidationError).toBe(true);
        expect(error instanceof Error).toBe(true);
      }
    });
  });
});
