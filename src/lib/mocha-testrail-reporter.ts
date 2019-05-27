import {reporters} from 'mocha';
import {TestRail} from "./testrail";
import {titleToCaseIds} from "./shared";
import {Status, TestRailOptions, TestRailResult} from "./testrail.interface";

class MochaTestRailReporter extends reporters.Spec {
    private results: TestRailResult[] = [];
    private passes: number = 0;
    private fails: number = 0;
    private pending: number = 0;
    private out: string[] = [];

    constructor(runner: any, options: any) {
        super(runner);

        const reporterOptions: TestRailOptions = <TestRailOptions>options.reporterOptions;
        this.validate(reporterOptions, 'domain');
        this.validate(reporterOptions, 'username');
        this.validate(reporterOptions, 'password');
        this.validate(reporterOptions, 'projectId');
        this.validate(reporterOptions, 'suiteId');
        this.validate(reporterOptions, 'customBuild');

        runner.on('start', () => {
        });

        runner.on('suite', (suite) => {
        });

        runner.on('suite end', () => {
        });

        runner.on('pending', (test) => {
            this.pending++;
            this.out.push(test.fullTitle() + ': pending');
        });

        runner.on('pass', (test) => {
            this.passes++;
            this.out.push(test.fullTitle() + ': pass');
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                if (test.speed === 'fast') {
                    let results = caseIds.map(caseId => {
                        return {
                            case_id: caseId,
                            status_id: Status.Passed,
                            comment: test.title,
                            custom_build: reporterOptions.customBuild,
                        };
                    });
                    this.results.push(...results);
                } else {
                    let results = caseIds.map(caseId => {
                        return {
                            case_id: caseId,
                            status_id: Status.Passed,
                            comment: `${test.title} (${test.duration}ms)`,
                            custom_build: reporterOptions.customBuild,
                        };
                    });
                    this.results.push(...results);
                }
            }
        });

        runner.on('fail', (test) => {
            this.fails++;
            this.out.push(test.fullTitle() + ': fail');
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                let results = caseIds.map(caseId => {
                    return {
                        case_id: caseId,
                        status_id: Status.Failed,
                        comment: `${test.title}
${test.err}`,
                        custom_build: reporterOptions.customBuild,
                    };
                });
                this.results.push(...results);
            }
        });

        runner.on('end', () => {
            if (this.results.length == 0) {
                console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx");
            }
            const executionDateTime = new Date().toISOString();
            const total = this.passes + this.fails + this.pending;
            const name = `Automated test run ${executionDateTime}`;
            const description = `Automated test run executed on ${executionDateTime}
Execution summary:
Passes: ${this.passes}
Fails: ${this.fails}
Pending: ${this.pending}
Total: ${total}

Execution details:
${this.out.join('\n')}                     
`;
            new TestRail(reporterOptions).publish(name, description, this.results);
        });
    }

    private validate(options: TestRailOptions, name: string) {
        if (options == null) {
            throw new Error("Missing --reporter-options in mocha.opts");
        }
        if (options[name] == null) {
            throw new Error(`Missing ${name} value. Please update --reporter-options in mocha.opts`);
        }
    }
}

export default MochaTestRailReporter;
