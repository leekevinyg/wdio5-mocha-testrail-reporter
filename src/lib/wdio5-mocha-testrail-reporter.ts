const events = require('events');
import TestRail from "./testrail";
import {titleToCaseIds} from "./shared"
import {Status, TestRailOptions, TestRailResult} from "./testrail.interface";

class Wdio5MochaTestrailReporter extends events.EventEmitter {
    private results: TestRailResult[] = [];
    private passes: number = 0;
    private fails: number = 0;
    private pending: number = 0;
    private out = [];
    private options: TestRailOptions;
    private testRail: TestRail;

    /**
     * @param {{}} baseReporter
     * @param {{testRailsOptions}} config wdio config
     */
    constructor(baseReporter: any, config) {
        super();
        this.options = config.testRailsOptions;
        this.testRail = new TestRail(this.options);

        this.on('test:pending', (test) => {
            this.pending++;
            this.out.push(test.title + ': pending');
        });

        this.on('test:pass', (test) => {
            this.passes++;
            this.out.push(test.title + ': pass');
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                const results: TestRailResult[] = caseIds.map(caseId => {
                    return {
                        case_id: caseId,
                        status_id: Status.Passed,
                        comment: `${this.getRunComment(test)}`
                    };
                });
                this.results.push(...results);
            }
        });

        this.on('test:fail', (test) => {
            this.fails++;
            this.out.push(test.title + ': fail');
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                let results: TestRailResult[] = caseIds.map(caseId => {
                    return {
                        case_id: caseId,
                        status_id: Status.Failed,
                        comment: `${this.getRunComment(test)}
${test.err.message}
${test.err.stack}
`
                    };
                });
                this.results.push(...results);
            }
        });

        this.on('end', () => {
            if (this.results.length === 0) {
                console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx\n" +
                  "You may use script generate-cases to do it automatically.");
                return;
            }

            const executionDateTime: Date = new Date();
            const total: number = this.passes + this.fails + this.pending;
            const runName: string = this.options.runName || Wdio5MochaTestrailReporter.reporterName;
            const name: string = `${runName}: automated test run ${executionDateTime}`;
            const description: string = `${name}
Execution summary:
Passes: ${this.passes}
Fails: ${this.fails}
Pending: ${this.pending}
Total: ${total}
`;
            this.testRail.publish(name, description, this.results);
        });
    }

    /**
     * @param {{title}} test
     * @return {string}
     */
    private static getRunComment(test): string {
        return test.title;
    }
}

// webdriver requires class to have reporterName option
Wdio5MochaTestrailReporter.reporterName = 'WebDriver.io test rail reporter';

export default Wdio5MochaTestrailReporter;
