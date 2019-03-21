import request from "then-request";
import {TestRailOptions} from "./testrail.interface";

/**
 * TestRail basic API wrapper
 */
class TestRail {
    private base: string;
    private options: TestRailOptions;

    constructor(options: TestRailOptions) {
        this.validate(options, 'domain');
        this.validate(options, 'username');
        this.validate(options, 'password');
        this.validate(options, 'projectId');
        this.validate(options, 'suiteId');

        // compute base url
        this.options = options;
        this.base = `https://${options.domain}/index.php`;
    }

    private validate(options: TestRailOptions, name: string) {
        if (options == null) {
            throw new Error("Missing testRailsOptions in wdio.conf");
        }
        if (options[name] == null) {
            throw new Error(`Missing ${name} value. Please update testRailsOptions in wdio.conf`);
        }
    }

    private url(path: string): string {
        return `${this.base}?${path}`;
    }

    private post(api: string, body: any, error = undefined): any {
        return this.request("POST", api, body, error);
    }

    private get(api: string, error = undefined): any {
        return this.request("GET", api, null, error);
    }

    private request(method: string, api: string, body: any, error = undefined): any {
        let options = {
            headers: {
                "Authorization": "Basic " + new Buffer(this.options.username + ":" + this.options.password).toString("base64"),
                "Content-Type": "application/json"
            },
        };
        if (body) {
            options['json'] = body;
        }

        let result = request(method, this.url(`/api/v2/${api}`), options);
        result = JSON.parse(result.getBody('utf8'));
        if (result.error) {
            console.log("Error: %s", JSON.stringify(result.body));
            if (error) {
                error(result.error);
            } else {
                throw new Error(result.error);
            }
        }
        return result;
    }

    addSection(title: string, parentId: string | null = null): number[] {
        let body = {
            "suite_id": this.options.suiteId,
            "name": title,
        };
        if (parentId) {
            body['parent_id'] = parentId;
        }
        return this.post(`add_section/${this.options.projectId}`, body);
    }

    getSections(): any[] {
        return this.get(`get_sections/${this.options.projectId}&suite_id=${this.options.suiteId}`);
    }

    addTestCase(title: string, sectionId: number): number[] {
        return this.post(`add_case/${sectionId}`, {
            "title": title
        });
    }

    addRun(name: string, description: string): any {
        return this.post(`add_run/${this.options.projectId}`, {
            "suite_id": this.options.suiteId,
            "name": name,
            "description": description,
            "assignedto_id": this.options.assignedToId,
            "include_all": true
        });
    }

    publish(name: string, description: string, results, callback = undefined) {
        let run = this.addRun(name, description);
        console.log(`Results published to ${this.base}?/runs/view/${run.id}`);
        let body = this.addResultsForCases(run.id, results);
        // execute callback if specified
        if (callback) {
            callback(body);
        }
    }

    addResultsForCases(runId: number, results: any): any {
        return this.post(`add_results_for_cases/${runId}`, {
            results: results
        });
    }
}

export default TestRail;
