export default class ISWC {
    prefix: string;
    identifier: number;
    checkDigit: number;

    constructor(prefix: string, identifier: number, checkDigit: number) {
        this.prefix = prefix;
        this.identifier = identifier;
        this.checkDigit = checkDigit;
    }

    isValid(): boolean {
        if (this.prefix !== "T") return false;

        if (!Number.isInteger(this.identifier)) return false;
        if (this.identifier < 1 || this.identifier > 999_999_999) return false;

        if (!Number.isInteger(this.checkDigit)) return false;
        return this.checkDigit === ISWC.computeCheckDigit(this.identifier);
    }

    toStringFormmated(): string {
        const id = this.identifier.toString().padStart(9, "0");
        return `${this.prefix}-${id.slice(0, 3)}.${id.slice(3, 6)}.${id.slice(6, 9)}-${this.checkDigit}`;
    }

    toString(): string {
        return this.prefix + this.identifier.toString().padStart(9, "0") + this.checkDigit;
    }

    static parse(rawISWC: string) {
        const stripped = rawISWC.replace(/[-.]/g, "");

        if (stripped.length !== 11) {
            throw new Error(
                `Invalid ISWC format: expected 11 characters after removing separators, got ${stripped.length}`
            );
        }

        const prefix = stripped[0];
        const identifierDigits = stripped.slice(1, 10);
        const checkDigitChar = stripped[10];

        if (!/^\d{9}$/.test(identifierDigits)) {
            throw new Error("Invalid ISWC format: work identifier must be exactly 9 digits");
        }

        if (!/^\d$/.test(checkDigitChar)) {
            throw new Error("Invalid ISWC format: check digit must be a single digit");
        }

        return new ISWC(prefix, parseInt(identifierDigits, 10), parseInt(checkDigitChar, 10));
    }

    static computeCheckDigit(identifier: number): number {
        const digits = identifier.toString().padStart(9, "0");
        let sum = 1;
        for (let i = 0; i < 9; i++) {
            sum += (i + 1) * Number(digits[i]);
        }
        return (10 - (sum % 10)) % 10;
    }
}
