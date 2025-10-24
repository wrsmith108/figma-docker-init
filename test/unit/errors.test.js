import { jest } from '@jest/globals';

describe('Custom Error Classes', () => {
  let module;

  beforeAll(async () => {
    module = await import('../../figma-docker-init.js');
  });

  describe('ValidationError', () => {
    test('should be exported', () => {
      expect(module.ValidationError).toBeDefined();
    });

    test('should extend Error', () => {
      const error = new module.ValidationError('test message');
      expect(error).toBeInstanceOf(Error);
    });

    test('should have correct name property', () => {
      const error = new module.ValidationError('test message');
      expect(error.name).toBe('ValidationError');
    });

    test('should preserve error message', () => {
      const message = 'Invalid input provided';
      const error = new module.ValidationError(message);
      expect(error.message).toBe(message);
    });
  });

  describe('ConfigError', () => {
    test('should be exported', () => {
      expect(module.ConfigError).toBeDefined();
    });

    test('should extend Error', () => {
      const error = new module.ConfigError('test message');
      expect(error).toBeInstanceOf(Error);
    });

    test('should have correct name property', () => {
      const error = new module.ConfigError('test message');
      expect(error.name).toBe('ConfigError');
    });

    test('should preserve error message', () => {
      const message = 'Config file not found';
      const error = new module.ConfigError(message);
      expect(error.message).toBe(message);
    });
  });

  describe('Error Usage in Validation Functions', () => {
    test('validateTemplateName should throw ValidationError for invalid names', () => {
      expect(() => {
        module.validateTemplateName('invalid!@#');
      }).toThrow(module.ValidationError);
    });

    test('validatePort should throw ValidationError for invalid ports', () => {
      expect(() => {
        module.validatePort(99999);
      }).toThrow(module.ValidationError);
    });

    test('validateProjectName should throw ValidationError for invalid names', () => {
      expect(() => {
        module.validateProjectName('invalid!@#$%');
      }).toThrow(module.ValidationError);
    });
  });
});
