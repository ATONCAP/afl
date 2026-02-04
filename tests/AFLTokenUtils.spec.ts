/**
 * Tests for AFL Token utility functions (formatBalance, parseAmount)
 * These handle 9-decimal precision for AFL token amounts
 */

// Extract the pure logic from useAFLToken hooks for testing
const DECIMALS = 9;
const DIVISOR = BigInt(10 ** DECIMALS);

function formatBalance(balance: bigint): string {
    const wholePart = balance / DIVISOR;
    const fractionalPart = balance % DIVISOR;
    const fractionalStr = fractionalPart.toString().padStart(DECIMALS, '0').replace(/0+$/, '');

    if (fractionalStr) {
        return `${wholePart.toLocaleString()}.${fractionalStr}`;
    }
    return wholePart.toLocaleString();
}

function parseAmount(amount: string): bigint {
    const [whole, fractional = ''] = amount.split('.');
    const paddedFractional = fractional.padEnd(DECIMALS, '0').slice(0, DECIMALS);
    return BigInt(whole || '0') * DIVISOR + BigInt(paddedFractional);
}

describe('AFL Token Utilities', () => {
    describe('formatBalance', () => {
        it('should format zero balance', () => {
            expect(formatBalance(BigInt(0))).toBe('0');
        });

        it('should format whole number balance (no decimals)', () => {
            // 1 AFL = 1_000_000_000 (10^9)
            expect(formatBalance(BigInt('1000000000'))).toBe('1');
            expect(formatBalance(BigInt('10000000000'))).toBe('10');
            expect(formatBalance(BigInt('100000000000'))).toBe('100');
        });

        it('should format balance with fractional part', () => {
            // 1.5 AFL = 1_500_000_000
            expect(formatBalance(BigInt('1500000000'))).toBe('1.5');
            // 1.123456789 AFL
            expect(formatBalance(BigInt('1123456789'))).toBe('1.123456789');
        });

        it('should strip trailing zeros from fractional part', () => {
            // 1.100000000 -> 1.1
            expect(formatBalance(BigInt('1100000000'))).toBe('1.1');
            // 1.120000000 -> 1.12
            expect(formatBalance(BigInt('1120000000'))).toBe('1.12');
        });

        it('should handle very small amounts (less than 1 AFL)', () => {
            // 0.000000001 AFL (1 nano)
            expect(formatBalance(BigInt(1))).toBe('0.000000001');
            // 0.5 AFL
            expect(formatBalance(BigInt('500000000'))).toBe('0.5');
            // 0.123456789 AFL
            expect(formatBalance(BigInt('123456789'))).toBe('0.123456789');
        });

        it('should handle large balances with locale formatting', () => {
            // 1,000 AFL
            const result1000 = formatBalance(BigInt('1000000000000'));
            expect(result1000).toMatch(/1[,.]?000/); // Locale-dependent separator

            // 1,000,000 AFL
            const result1M = formatBalance(BigInt('1000000000000000'));
            expect(result1M).toMatch(/1[,.]?000[,.]?000/);
        });

        it('should handle maximum precision (9 decimals)', () => {
            // 0.999999999 AFL
            expect(formatBalance(BigInt('999999999'))).toBe('0.999999999');
            // 123.456789012 would be truncated since we only store 9 decimals
        });

        it('should handle negative numbers correctly', () => {
            // Note: In practice, balances should never be negative
            // but the function should handle it mathematically
            expect(formatBalance(BigInt(-1000000000))).toBe('-1');
        });
    });

    describe('parseAmount', () => {
        it('should parse zero', () => {
            expect(parseAmount('0')).toBe(BigInt(0));
            expect(parseAmount('0.0')).toBe(BigInt(0));
        });

        it('should parse whole numbers', () => {
            expect(parseAmount('1')).toBe(BigInt('1000000000'));
            expect(parseAmount('10')).toBe(BigInt('10000000000'));
            expect(parseAmount('100')).toBe(BigInt('100000000000'));
        });

        it('should parse decimal amounts', () => {
            expect(parseAmount('1.5')).toBe(BigInt('1500000000'));
            expect(parseAmount('1.123456789')).toBe(BigInt('1123456789'));
        });

        it('should pad short fractional parts', () => {
            expect(parseAmount('1.1')).toBe(BigInt('1100000000'));
            expect(parseAmount('1.12')).toBe(BigInt('1120000000'));
            expect(parseAmount('1.123')).toBe(BigInt('1123000000'));
        });

        it('should truncate overly precise fractional parts', () => {
            // More than 9 decimal places should be truncated
            expect(parseAmount('1.1234567891')).toBe(BigInt('1123456789'));
            expect(parseAmount('1.123456789999')).toBe(BigInt('1123456789'));
        });

        it('should parse amounts less than 1', () => {
            expect(parseAmount('0.5')).toBe(BigInt('500000000'));
            expect(parseAmount('0.000000001')).toBe(BigInt(1));
            expect(parseAmount('0.123456789')).toBe(BigInt('123456789'));
        });

        it('should handle empty whole part', () => {
            expect(parseAmount('.5')).toBe(BigInt('500000000'));
            expect(parseAmount('.123456789')).toBe(BigInt('123456789'));
        });

        it('should handle large amounts', () => {
            expect(parseAmount('1000')).toBe(BigInt('1000000000000'));
            expect(parseAmount('1000000')).toBe(BigInt('1000000000000000'));
        });
    });

    describe('formatBalance and parseAmount round-trip', () => {
        const testCases = [
            BigInt(0),
            BigInt(1),
            BigInt('1000000000'),      // 1 AFL
            BigInt('1500000000'),      // 1.5 AFL
            BigInt('1123456789'),      // 1.123456789 AFL
            BigInt('500000000'),       // 0.5 AFL
            BigInt('123456789'),       // 0.123456789 AFL
            BigInt('1000000000000'),   // 1000 AFL
            BigInt('999999999'),       // 0.999999999 AFL
        ];

        testCases.forEach((original) => {
            it(`should round-trip ${original.toString()}`, () => {
                const formatted = formatBalance(original);
                // Remove locale-specific separators for parsing
                const cleanedFormat = formatted.replace(/,/g, '');
                const parsed = parseAmount(cleanedFormat);
                expect(parsed).toBe(original);
            });
        });
    });

    describe('edge cases', () => {
        it('should handle empty string as zero', () => {
            expect(parseAmount('')).toBe(BigInt(0));
        });

        it('should handle string with only decimal point', () => {
            expect(parseAmount('.')).toBe(BigInt(0));
        });

        it('should handle trailing decimal point', () => {
            expect(parseAmount('1.')).toBe(BigInt('1000000000'));
        });

        it('should handle leading zeros in whole part', () => {
            expect(parseAmount('01')).toBe(BigInt('1000000000'));
            expect(parseAmount('001.5')).toBe(BigInt('1500000000'));
        });

        it('should handle maximum safe integer range', () => {
            // Total AFL supply could be 1 billion = 1_000_000_000 AFL
            // In smallest units: 1_000_000_000 * 10^9 = 10^18
            const maxSupply = BigInt('1000000000000000000');
            const formatted = formatBalance(maxSupply);
            expect(formatted).toBeTruthy();
            // Clean locale separators for parsing
            const cleanedFormat = formatted.replace(/,/g, '');
            const parsed = parseAmount(cleanedFormat);
            expect(parsed).toBe(maxSupply);
        });
    });
});
