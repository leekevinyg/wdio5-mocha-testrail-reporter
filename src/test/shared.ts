import {expect} from "chai";

import {titleToCaseIds} from "../lib/shared";

describe("Shared functions", () => {
    describe("titleToCaseIds", () => {
        it("Single test case id present", () => {
            const caseIds1 = titleToCaseIds("C123 Test title");
            expect(caseIds1.length).to.eq(1);
            expect(caseIds1[0]).to.eq(123);

            const caseIds2 = titleToCaseIds("Execution of C123 Test title");
            expect(caseIds2.length).to.eq(1);
            expect(caseIds2[0]).to.eq(123);
        });
        it("Multiple test case ids present", () => {
            const caseIds = titleToCaseIds("Execution C321 C123 Test title");
            expect(caseIds.length).to.eq(2);
            expect(caseIds[0]).to.eq(321);
            expect(caseIds[1]).to.eq(123);
        });
        it("No test case ids present", () => {
            const caseIds = titleToCaseIds("Execution Test title");
            expect(caseIds.length).to.eq(0);
        });
    });

    describe("Misc tests", () => {
        it("String join", () => {
            const out: string[] = [];
            out.push("Test 1: fail");
            out.push("Test 2: pass");
            expect(out.join('\n')).to.eq(`Test 1: fail
Test 2: pass`);
        });
    });
});
