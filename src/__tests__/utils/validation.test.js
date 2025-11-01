import { isValidWalletAddress } from '../../utils/validation';

describe('validation utilities', () => {
  describe('isValidWalletAddress', () => {
    it('returns true for valid Solana wallet addresses', () => {
      const validAddresses = [
        '5KtPn1KN8GWvBVwgkQHGHhH8YzwGZgQQDXS6fdKD7VQF',
        '7YttLkHGczovZ8VGvxTP3va3TLWtUmhLcWGZ5hpd4Ljg',
        'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw'
      ];

      validAddresses.forEach(address => {
        expect(isValidWalletAddress(address)).toBe(true);
      });
    });

    describe('returns false for invalid inputs', () => {
      it('rejects non-string inputs', () => {
        const nonStringInputs = [
          null,
          undefined,
          123,
          {},
          [],
          true,
          false
        ];

        nonStringInputs.forEach(input => {
          expect(isValidWalletAddress(input)).toBe(false);
        });
      });

      it('rejects empty or whitespace strings', () => {
        const emptyInputs = [
          '',
          ' ',
          '   ',
          '\t',
          '\n'
        ];

        emptyInputs.forEach(input => {
          expect(isValidWalletAddress(input)).toBe(false);
        });
      });

      it('rejects addresses with invalid length', () => {
        const invalidLengthAddresses = [
          'abc', // too short
          'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHP', // 31 chars
          'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw12', // 46 chars
          'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw12345', // way too long
          'Dfi', // way too short
        ];

        invalidLengthAddresses.forEach(address => {
          expect(isValidWalletAddress(address)).toBe(false);
        });
      });

      it('rejects addresses with invalid characters', () => {
        const addressesWithInvalidChars = [
          '0fiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw', // starts with 0
          'IfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw', // contains I
          'OfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw', // contains O
          'lfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVjw', // contains l
          'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVj!', // contains !
          'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVj#', // contains #
          'DfiGBi6GhpUvhkQDQxqfqFSxeGJJqHPg5K7zeqD4qVj$', // contains $
        ];

        addressesWithInvalidChars.forEach(address => {
          expect(isValidWalletAddress(address)).toBe(false);
        });
      });
    });

    it('handles addresses with whitespace by trimming', () => {
      const validAddress = '5KtPn1KN8GWvBVwgkQHGHhH8YzwGZgQQDXS6fdKD7VQF';
      expect(isValidWalletAddress(`  ${validAddress}  `)).toBe(true);
      expect(isValidWalletAddress(`\t${validAddress}\t`)).toBe(true);
      expect(isValidWalletAddress(`\n${validAddress}\n`)).toBe(true);
    });
  });
}); 