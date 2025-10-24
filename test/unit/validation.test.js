/**
 * Test: Validation Functions
 * Purpose: Comprehensive testing of all 7 validation functions
 * Coverage Target: 100% of validation code (lines 50-154)
 */

import {
  sanitizeString,
  validateTemplateName,
  validateProjectDirectory,
  validatePort,
  validateProjectName,
  sanitizeTemplateVariable,
  validateFilePath,
  ValidationError
} from '../../figma-docker-init.js';
import path from 'path';

describe('Validation Functions', () => {
  // =============================================================================
  // sanitizeString
  // =============================================================================
  describe('sanitizeString', () => {
    describe('Happy paths', () => {
      it('should trim whitespace from strings', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
      });

      it('should remove null bytes', () => {
        expect(sanitizeString('hello\x00world')).toBe('helloworld');
      });

      it('should remove control characters', () => {
        expect(sanitizeString('hello\x01\x02\x03world')).toBe('helloworld');
      });

      it('should handle strings with multiple control chars', () => {
        expect(sanitizeString('test\x00\x01\x02\x1F\x7Fdata')).toBe('testdata');
      });

      it('should allow strings up to maxLength', () => {
        const str = 'a'.repeat(255);
        expect(sanitizeString(str)).toBe(str);
      });

      it('should respect custom maxLength', () => {
        const str = 'a'.repeat(50);
        expect(sanitizeString(str, 50)).toBe(str);
      });
    });

    describe('Error handling', () => {
      it('should throw ValidationError for non-string input', () => {
        expect(() => sanitizeString(123)).toThrow(ValidationError);
        expect(() => sanitizeString(123)).toThrow('Input must be a string');
      });

      it('should throw ValidationError for null', () => {
        expect(() => sanitizeString(null)).toThrow(ValidationError);
      });

      it('should throw ValidationError for undefined', () => {
        expect(() => sanitizeString(undefined)).toThrow(ValidationError);
      });

      it('should throw ValidationError for objects', () => {
        expect(() => sanitizeString({})).toThrow(ValidationError);
      });

      it('should throw ValidationError when exceeding maxLength', () => {
        const longString = 'a'.repeat(256);
        expect(() => sanitizeString(longString)).toThrow(ValidationError);
        expect(() => sanitizeString(longString)).toThrow('exceeds maximum length');
      });

      it('should throw ValidationError with custom maxLength exceeded', () => {
        const str = 'a'.repeat(101);
        expect(() => sanitizeString(str, 100)).toThrow('exceeds maximum length of 100');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty strings', () => {
        expect(sanitizeString('')).toBe('');
      });

      it('should handle whitespace-only strings', () => {
        expect(sanitizeString('   ')).toBe('');
      });

      it('should handle strings with only control characters', () => {
        expect(sanitizeString('\x00\x01\x02')).toBe('');
      });
    });
  });

  // =============================================================================
  // validateTemplateName
  // =============================================================================
  describe('validateTemplateName', () => {
    describe('Happy paths', () => {
      it('should allow valid alphanumeric names', () => {
        expect(validateTemplateName('basic')).toBe('basic');
        expect(validateTemplateName('template123')).toBe('template123');
      });

      it('should allow hyphens', () => {
        expect(validateTemplateName('ui-heavy')).toBe('ui-heavy');
      });

      it('should allow underscores', () => {
        expect(validateTemplateName('my_template')).toBe('my_template');
      });

      it('should allow mixed valid characters', () => {
        expect(validateTemplateName('template-name_123')).toBe('template-name_123');
      });

      it('should trim whitespace', () => {
        expect(validateTemplateName('  basic  ')).toBe('basic');
      });
    });

    describe('Error handling', () => {
      it('should throw ValidationError for names with spaces', () => {
        expect(() => validateTemplateName('my template')).toThrow(ValidationError);
        expect(() => validateTemplateName('my template')).toThrow('invalid characters');
      });

      it('should throw ValidationError for special characters', () => {
        expect(() => validateTemplateName('template@123')).toThrow(ValidationError);
        expect(() => validateTemplateName('template#name')).toThrow(ValidationError);
      });

      it('should throw ValidationError for paths', () => {
        expect(() => validateTemplateName('../template')).toThrow(ValidationError);
        expect(() => validateTemplateName('./template')).toThrow(ValidationError);
      });

      it('should throw ValidationError for exceeding max length', () => {
        const longName = 'a'.repeat(51);
        expect(() => validateTemplateName(longName)).toThrow(ValidationError);
      });
    });

    describe('Edge cases', () => {
      it('should handle single character names', () => {
        expect(validateTemplateName('a')).toBe('a');
      });

      it('should handle max length names', () => {
        const maxName = 'a'.repeat(50);
        expect(validateTemplateName(maxName)).toBe(maxName);
      });
    });
  });

  // =============================================================================
  // validateProjectDirectory
  // =============================================================================
  describe('validateProjectDirectory', () => {
    describe('Happy paths', () => {
      it('should validate current directory', () => {
        const result = validateProjectDirectory('.');
        expect(result).toBe(process.cwd());
      });

      it('should validate subdirectories', () => {
        const result = validateProjectDirectory('test');
        expect(result).toContain('test');
        expect(result.startsWith(process.cwd())).toBe(true);
      });

      it('should resolve relative paths', () => {
        const result = validateProjectDirectory('./src');
        expect(result).toContain('src');
        expect(result.startsWith(process.cwd())).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should throw ValidationError for directory traversal', () => {
        expect(() => validateProjectDirectory('..')).toThrow(ValidationError);
        expect(() => validateProjectDirectory('..')).toThrow('within the current working directory');
      });

      it('should throw ValidationError for absolute paths outside cwd', () => {
        expect(() => validateProjectDirectory('/tmp')).toThrow(ValidationError);
      });

      it('should throw ValidationError for path with traversal', () => {
        expect(() => validateProjectDirectory('test/../../etc')).toThrow(ValidationError);
      });

      it('should throw ValidationError for paths exceeding max length', () => {
        const longPath = 'a'.repeat(4097);
        expect(() => validateProjectDirectory(longPath)).toThrow(ValidationError);
      });
    });

    describe('State verification', () => {
      it('should not modify process.cwd()', () => {
        const originalCwd = process.cwd();
        validateProjectDirectory('.');
        expect(process.cwd()).toBe(originalCwd);
      });
    });
  });

  // =============================================================================
  // validatePort
  // =============================================================================
  describe('validatePort', () => {
    describe('Happy paths', () => {
      it('should validate standard ports', () => {
        expect(validatePort(80)).toBe(80);
        expect(validatePort(443)).toBe(443);
        expect(validatePort(3000)).toBe(3000);
        expect(validatePort(8080)).toBe(8080);
      });

      it('should validate string port numbers', () => {
        expect(validatePort('3000')).toBe(3000);
        expect(validatePort('8080')).toBe(8080);
      });

      it('should validate min port (1)', () => {
        expect(validatePort(1)).toBe(1);
      });

      it('should validate max port (65535)', () => {
        expect(validatePort(65535)).toBe(65535);
      });
    });

    describe('Error handling', () => {
      it('should throw ValidationError for port 0', () => {
        expect(() => validatePort(0)).toThrow(ValidationError);
        expect(() => validatePort(0)).toThrow('between 1 and 65535');
      });

      it('should throw ValidationError for negative ports', () => {
        expect(() => validatePort(-1)).toThrow(ValidationError);
        expect(() => validatePort(-100)).toThrow(ValidationError);
      });

      it('should throw ValidationError for ports > 65535', () => {
        expect(() => validatePort(65536)).toThrow(ValidationError);
        expect(() => validatePort(100000)).toThrow(ValidationError);
      });

      it('should throw ValidationError for NaN', () => {
        expect(() => validatePort('invalid')).toThrow(ValidationError);
        expect(() => validatePort(NaN)).toThrow(ValidationError);
      });

      it('should throw ValidationError for non-numeric strings', () => {
        expect(() => validatePort('abc')).toThrow(ValidationError);
        expect(() => validatePort('3000abc')).toThrow(ValidationError);
      });
    });

    describe('Edge cases', () => {
      it('should handle string numbers with leading zeros', () => {
        expect(validatePort('0008080')).toBe(8080);
      });

      it('should handle float strings by truncating', () => {
        expect(validatePort('3000.5')).toBe(3000);
      });
    });
  });

  // =============================================================================
  // validateProjectName
  // =============================================================================
  describe('validateProjectName', () => {
    describe('Happy paths', () => {
      it('should validate npm-compatible names', () => {
        expect(validateProjectName('my-app')).toBe('my-app');
        expect(validateProjectName('my_app')).toBe('my_app');
      });

      it('should allow dots', () => {
        expect(validateProjectName('my.app')).toBe('my.app');
      });

      it('should allow numbers', () => {
        expect(validateProjectName('app123')).toBe('app123');
      });

      it('should trim whitespace', () => {
        expect(validateProjectName('  my-app  ')).toBe('my-app');
      });
    });

    describe('Error handling', () => {
      it('should throw ValidationError for spaces', () => {
        expect(() => validateProjectName('my app')).toThrow(ValidationError);
        expect(() => validateProjectName('my app')).toThrow('invalid characters');
      });

      it('should throw ValidationError for special characters', () => {
        expect(() => validateProjectName('my@app')).toThrow(ValidationError);
        expect(() => validateProjectName('my#app')).toThrow(ValidationError);
      });

      it('should throw ValidationError for exceeding max length', () => {
        const longName = 'a'.repeat(101);
        expect(() => validateProjectName(longName)).toThrow(ValidationError);
      });
    });

    describe('Edge cases', () => {
      it('should handle single character names', () => {
        expect(validateProjectName('a')).toBe('a');
      });

      it('should handle names with mixed separators', () => {
        expect(validateProjectName('my-app_v1.0')).toBe('my-app_v1.0');
      });
    });
  });

  // =============================================================================
  // sanitizeTemplateVariable
  // =============================================================================
  describe('sanitizeTemplateVariable', () => {
    describe('Happy paths', () => {
      it('should sanitize string values', () => {
        expect(sanitizeTemplateVariable('value')).toBe('value');
      });

      it('should remove angle brackets from strings', () => {
        expect(sanitizeTemplateVariable('<script>alert()</script>')).toBe('scriptalert()/script');
      });

      it('should trim string values', () => {
        expect(sanitizeTemplateVariable('  value  ')).toBe('value');
      });

      it('should pass through boolean values', () => {
        expect(sanitizeTemplateVariable(true)).toBe(true);
        expect(sanitizeTemplateVariable(false)).toBe(false);
      });

      it('should pass through number values', () => {
        expect(sanitizeTemplateVariable(42)).toBe(42);
        expect(sanitizeTemplateVariable(3.14)).toBe(3.14);
      });
    });

    describe('Edge cases', () => {
      it('should convert null to string', () => {
        const result = sanitizeTemplateVariable(null);
        expect(typeof result).toBe('string');
        expect(result).toBe('null');
      });

      it('should convert undefined to string', () => {
        const result = sanitizeTemplateVariable(undefined);
        expect(typeof result).toBe('string');
        expect(result).toBe('undefined');
      });

      it('should convert objects to string', () => {
        const result = sanitizeTemplateVariable({ key: 'value' });
        expect(typeof result).toBe('string');
      });

      it('should convert arrays to string', () => {
        const result = sanitizeTemplateVariable([1, 2, 3]);
        expect(typeof result).toBe('string');
      });

      it('should handle empty strings', () => {
        expect(sanitizeTemplateVariable('')).toBe('');
      });

      it('should handle very long strings up to 1000 chars', () => {
        const longString = 'a'.repeat(1000);
        const result = sanitizeTemplateVariable(longString);
        expect(result.length).toBeLessThanOrEqual(1000);
      });

      it('should handle non-string types exceeding 1000 chars when converted', () => {
        const tooLong = 'a'.repeat(1001);
        const obj = { data: tooLong };
        // Should convert to string and handle
        const result = sanitizeTemplateVariable(obj);
        expect(typeof result).toBe('string');
      });
    });
  });

  // =============================================================================
  // validateFilePath
  // =============================================================================
  describe('validateFilePath', () => {
    const baseDir = process.cwd();

    describe('Happy paths', () => {
      it('should validate paths within base directory', () => {
        const result = validateFilePath('test.txt', baseDir);
        expect(result).toContain('test.txt');
        expect(result.startsWith(path.resolve(baseDir))).toBe(true);
      });

      it('should validate subdirectory paths', () => {
        const result = validateFilePath('src/index.js', baseDir);
        expect(result).toContain('src');
        expect(result).toContain('index.js');
      });

      it('should resolve relative paths', () => {
        const result = validateFilePath('./file.txt', baseDir);
        expect(result.startsWith(path.resolve(baseDir))).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should throw ValidationError for directory traversal', () => {
        expect(() => validateFilePath('../etc/passwd', baseDir)).toThrow(ValidationError);
        expect(() => validateFilePath('../etc/passwd', baseDir)).toThrow('outside allowed directory');
      });

      it('should throw ValidationError for absolute paths outside baseDir', () => {
        expect(() => validateFilePath('/etc/passwd', baseDir)).toThrow(ValidationError);
      });

      it('should throw ValidationError for complex traversal attempts', () => {
        expect(() => validateFilePath('safe/../../etc/passwd', baseDir)).toThrow(ValidationError);
      });

      it('should throw ValidationError for paths exceeding max length', () => {
        const longPath = 'a'.repeat(4097);
        expect(() => validateFilePath(longPath, baseDir)).toThrow(ValidationError);
      });
    });

    describe('State verification', () => {
      it('should not modify the base directory', () => {
        const originalBaseDir = baseDir;
        validateFilePath('test.txt', baseDir);
        expect(baseDir).toBe(originalBaseDir);
      });

      it('should handle multiple calls with same baseDir', () => {
        const result1 = validateFilePath('file1.txt', baseDir);
        const result2 = validateFilePath('file2.txt', baseDir);
        expect(result1).toContain('file1.txt');
        expect(result2).toContain('file2.txt');
      });
    });
  });
});
