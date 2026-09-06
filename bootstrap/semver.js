class Semver {
    /**
     * @param {string} semver
     */
    constructor(semver) {
        /** @type {number[]} */
        this.chunks = semver.split(".").map((n) => parseInt(n));

        if (this.chunks.length !== 3)
            throw new Error(`Semver ${semver} should have 3 chunks, but got ${this.chunks.length}`);
    }

    /**
     * @param {string} semver
     * @returns {Semver}
     */
    static parse(semver) {
        return new Semver(semver);
    }

    /**
     * @param {Semver} other
     * @returns {boolean}
     */
    equals(other) {
        return (
            this.chunks[0] === other.chunks[0] &&
            this.chunks[1] === other.chunks[1] &&
            this.chunks[2] === other.chunks[2]
        );
    }

    /**
     * @param {Semver} other
     * @returns {boolean}
     */
    le(other) {
        return this.lt(other) || this.equals(other);
    }

    /**
     * @param {Semver} other
     * @returns {boolean}
     */
    lt(other) {
        if (this.chunks[0] > other.chunks[0]) return false;
        if (this.chunks[0] < other.chunks[0]) return true;

        if (this.chunks[1] > other.chunks[1]) return false;
        if (this.chunks[1] < other.chunks[1]) return true;

        return this.chunks[2] < other.chunks[2];
    }

    /**
     * @param {Semver} other
     * @returns {boolean}
     */
    patchOnlyLe(other) {
        return (
            this.chunks[0] == other.chunks[0] &&
            this.chunks[1] == other.chunks[1] &&
            this.chunks[2] <= other.chunks[2]
        );
    }

    /**
     * @param {Semver} other
     * @returns {boolean}
     */
    minorOnlyLe(other) {
        return this.le(other) && this.chunks[0] === other.chunks[0];
    }
}

/**
 * @typedef {"~"|"^"|">="|">"|"<="|"<"} CompareOperator
 * @typedef {{ type: "any" }} Any
 * @typedef {{type: CompareOperator, value: Semver}} Compare
 * @typedef {{type: "concrete", value: Semver}} Concrete
 * @typedef {{type: "and", left: SemverPattern, right: SemverPattern}} And
 * @typedef {{type: "or", left: SemverPattern, right: SemverPattern}} Or
 * @typedef {Compare | Any | And | Or | Concrete} SemverPatternTree
 *
 * @typedef {{"type": "operator", value: CompareOperator}} SemverPatternOperatorToken
 * @typedef {{"type": "openbracket"}} SemverPatternOpenBracketToken
 * @typedef {{"type": "any"}} SemverPatternAnyToken
 * @typedef {{"type": "closebracket"}} SemverPatternCloseBracketToken
 * @typedef {{"type": "concrete", value: Semver}} SemverPatternValueToken
 * @typedef {{"type": "or"}} SemverPatternOrToken
 * @typedef {SemverPatternOperatorToken | SemverPatternCloseBracketToken | SemverPatternOpenBracketToken | SemverPatternValueToken | SemverPatternAnyToken | SemverPatternOrToken} SemverPatternToken
 */

/**
 * @param {string} pattern
 * @returns {SemverPatternToken[]}
 */
function semverPatternTokeniser(pattern) {
    /** @type {SemverPatternToken[]} */
    let out = [];

    /** @type {{type: SemverPatternToken['type'], content: string[]} | null} */
    let buffer = null;

    function flushBuffer() {
        if (buffer === null) return;

        switch (buffer.type) {
            case "operator": {
                const operatorString = buffer.content.join("");
                switch (operatorString) {
                    case ">=":
                    case ">":
                    case "<":
                    case "<=":
                    case "~":
                    case "^":
                        break;
                    default:
                        throw new Error(`Unknown semver operator ${operatorString} in ${pattern}`);
                }
                out.push({ type: "operator", value: operatorString });
                break;
            }
            case "openbracket":
                out.push({ type: "openbracket" });
                break;
            case "closebracket":
                out.push({ type: "closebracket" });
                break;
            case "any":
                out.push({ type: "any" });
                break;
            case "concrete":
                out.push({ type: "concrete", value: new Semver(buffer.content.join("")) });
                break;
            case "or":
                if (buffer.content.length !== 2)
                    throw new Error(`Incomplete OR expression in semver pattern ${pattern}`);
                out.push({ type: "or" });
        }

        buffer = null;
    }

    for (const c of pattern) {
        switch (c) {
            // opening characters of an operator
            case ">":
            case "<":
            case "~":
            case "^":
                flushBuffer();
                buffer = { type: "operator", content: [c] };
                break;
            case "=":
                if (buffer === null || buffer.type !== "operator")
                    throw new Error(`Unexpected token ${c} in semver pattern ${pattern}`);

                buffer.content.push(c);
                break;
            case "*":
                flushBuffer();
                buffer = { type: "any", content: [c] };
                break;
            case "|":
                if (buffer?.type === "or") {
                    buffer.content.push("|");
                    flushBuffer();
                } else {
                    flushBuffer();
                    buffer = { type: "or", content: [c] };
                }
                break;
            case " ":
                flushBuffer();
                break;
            case "(":
                flushBuffer();
                buffer = { type: "openbracket", content: [c] };
                break;
            case ")":
                flushBuffer();
                buffer = { type: "closebracket", content: [c] };
                break;
            default:
                if (!"0123456789.".split("").includes(c))
                    throw new Error(`Unexpected character ${c} in semver pattern ${pattern}`);

                if (buffer?.type !== "concrete") {
                    flushBuffer();
                    buffer = { type: "concrete", content: [] };
                }

                buffer.content.push(c);
        }
    }

    flushBuffer();

    return out;
}

class SemverPattern {
    /**
     * @param {SemverPatternTree} tree
     */
    constructor(tree) {
        /** @type {SemverPatternTree} */
        this.tree = tree;
    }

    /**
     * @param {SemverPatternToken[]} tokens
     * @return {SemverPattern}
     */
    static fromTokens(tokens) {
        if (tokens.length === 0) throw new Error("Semver cannot be empty");

        /** @type {SemverPattern} */
        let head;
        /** @type {SemverPatternToken[]} */
        let tail;

        switch (tokens[0].type) {
            case "openbracket":
                {
                    let bracketDepth = 1;
                    let i = 1;
                    // after the for loop, i points to the token after the closing bracket
                    for (; bracketDepth !== 0; i++) {
                        switch (tokens[i].type) {
                            case "openbracket":
                                bracketDepth++;
                                break;
                            case "closebracket":
                                bracketDepth--;
                                break;
                        }
                    }

                    head = SemverPattern.fromTokens(tokens.slice(1, i - 1));
                    tail = tokens.slice(i);
                }
                break;
            case "operator":
                if (tokens[1]?.type !== "concrete")
                    throw new Error(`Expected concrete semver after operator ${tokens}`);

                head = new SemverPattern({ type: tokens[0].value, value: tokens[1].value });
                tail = tokens.slice(2);
                break;
            case "concrete":
                head = new SemverPattern(tokens[0]);
                tail = tokens.slice(1);
                break;
            case "any":
                head = new SemverPattern({ type: "any" });
                tail = tokens.slice(1);
                break;
            default:
                throw new Error(`Unexpected token ${JSON.stringify(tokens[0])}`);
        }

        switch (tail[0]?.type) {
            case undefined:
                return head;
            case "or":
                return new SemverPattern({
                    type: "or",
                    left: head,
                    right: SemverPattern.fromTokens(tail.slice(1)),
                });
            default: // and
                return new SemverPattern({
                    type: "and",
                    left: head,
                    right: SemverPattern.fromTokens(tail),
                });
        }
    }

    /**
     * @param {string} pattern
     * @returns {SemverPattern}
     */
    static parse(pattern) {
        const tokens = semverPatternTokeniser(pattern);

        // sweep to check if the brackets are correct
        let bracketDepth = 0;
        for (const token of tokens) {
            switch (token.type) {
                case "openbracket":
                    bracketDepth++;
                    break;
                case "closebracket":
                    bracketDepth--;
                    if (bracketDepth < 0)
                        throw new Error(`Incorrect bracketing for semver pattern ${pattern}`);
            }
        }

        try {
            return SemverPattern.fromTokens(tokens);
        } catch (e) {
            throw new Error(`Failed to parse semver pattern ${pattern} - ${e}`);
        }
    }

    /**
     * @param {Semver} semver
     * @returns {boolean}
     */
    isMatch(semver) {
        switch (this.tree.type) {
            case "concrete":
                return this.tree.value.equals(semver);
            case "any":
                return true;
            case "or":
                return this.tree.left.isMatch(semver) || this.tree.right.isMatch(semver);
            case "and":
                return this.tree.left.isMatch(semver) && this.tree.right.isMatch(semver);
            case ">=":
                return this.tree.value.le(semver);
            case ">":
                return this.tree.value.lt(semver);
            case "<=":
                return semver.le(this.tree.value);
            case "<":
                return semver.lt(this.tree.value);
            case "~":
                return this.tree.value.patchOnlyLe(semver);
            case "^":
                return this.tree.value.minorOnlyLe(semver);
        }
    }
}

module.exports = {
    Semver,
    SemverPattern,
};
