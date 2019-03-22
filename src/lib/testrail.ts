import * as rm from "typed-rest-client/RestClient";
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

    private validate(options: TestRailOptions, name: string): void {
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

    private restClient(): rm.RestClient {
        const options = {
            headers: {
                "Authorization": "Basic " + new Buffer(this.options.username + ":" + this.options.password).toString("base64"),
                "Content-Type": "application/json"
            },
        };
        return new rm.RestClient(
          "testrail",
          this.base,
          null,
          options
        );
    }

    private async post(api: string, body: any) {
        try {
            const res: rm.IRestResponse<any> = await this.restClient().create(`/api/v2/${api}`, body);
            return res.result;
        } catch (e) {
            console.log("Error: %s", JSON.stringify(e));
            throw Error(e);
        }
    }

    private async get(api: string) {
        try {
            const res: rm.IRestResponse<any> = await this.restClient().get(`/api/v2/${api}`);
            return res.result;
        } catch (e) {
            console.log("Error: %s", JSON.stringify(e));
            throw Error(e);
        }
    }

    addSection(title: string, parentId: string | null = null) {
        const body = {
            "suite_id": this.options.suiteId,
            "name": title,
        };
        if (parentId) {
            body['parent_id'] = parentId;
        }
        return this.post(`add_section/${this.options.projectId}`, body);
    }

    getSections() {
        return this.get(`get_sections/${this.options.projectId}&suite_id=${this.options.suiteId}`);
    }

    addTestCase(title: string, sectionId: number) {
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

    publish(name: string, description: string, results) {
        let run = this.addRun(name, description);
        console.log(`Results published to ${this.base}?/runs/view/${run.id}`);
        let body = this.addResultsForCases(run.id, results);
    }

    addResultsForCases(runId: number, results: any): any {
        return this.post(`add_results_for_cases/${runId}`, {
            results: results
        });
    }
}

export default TestRail;
