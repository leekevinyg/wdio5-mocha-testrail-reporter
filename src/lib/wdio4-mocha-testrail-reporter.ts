let events = require('events');
import TestRail from "./testrail";
import {titleToCaseIds} from "./shared"
import {Status} from "./testrail.interface";

class WdioTestRailReporter extends events.EventEmitter {
    private results = [];
    private passes = 0;
    private fails = 0;
    private pending = 0;
    private out = [];

    /**
     * @param {{}} baseReporter
     * @param {{testRailsOptions}} config wdio config
     */
    constructor(baseReporter, config) {
        super();
        const options = config.testRailsOptions;

        this.testRail = new TestRail(options);

        this.on('test:pending', (test) => {
            this.pending++;
            this.out.push(test.title + ': pending');
        });

        this.on('test:pass', (test) => {
            this.passes++;
            this.out.push(test.title + ': pass');
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                const results = caseIds.map(caseId => {
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
                let results = caseIds.map(caseId => {
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
            if (this.results.length == 0) {
                console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx\n" +
                  "You may use script generate-cases to do it automatically.");
                return;
            }

            const executionDateTime = new Date();
            const total = this.passes + this.fails + this.pending;
            const runName = options.runName || WdioTestRailReporter.reporterName;
            const name = `${runName}: automated test run ${executionDateTime}`;
            const description = `${name}
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
    getRunComment(test) {
        return test.title;
    }
}
