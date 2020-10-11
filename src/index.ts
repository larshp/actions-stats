import {Octokit, RestEndpointMethodTypes} from "@octokit/rest";

const owner = "abapGit";
const repo = "abapGit";
const MAX_PAGES = 5;
const PER_PAGE = 100; // max 100

async function run() {
  const octokit = new Octokit();

  console.log(owner + "/" + repo);
  const all: {id: number, created_at: string, updated_at: string}[] = [];
  for (let i = 1; i <= MAX_PAGES; i++) {
    const p: RestEndpointMethodTypes["actions"]["listWorkflowRunsForRepo"]["parameters"] = {
      owner: owner,
      repo: repo,
      page: i,
      per_page: PER_PAGE,
    };
    const page = await octokit.actions.listWorkflowRunsForRepo(p);
    for (const run of page.data.workflow_runs) {
      all.push({id: run.id, created_at: run.created_at, updated_at: run.updated_at});
    }
    if (page.data.workflow_runs.length < PER_PAGE) {
      break;
    }
  }

  // aggregate
  const result: {[index:string] : {runs: number, seconds: number}} = {};
  for (const r of all) {
    const date = (new Date(r.created_at).getMonth() + 1).toString().padStart(2, "0") + "-" + new Date(r.created_at).getDate().toString().padStart(2, "0");
    if (result[date] === undefined) {
      result[date] = {runs: 0, seconds: 0};
    }
    result[date].runs += 1;
    const seconds = (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 1000;
    result[date].seconds += seconds;
  }
  console.dir(result);

  let totalTime = 0;
  let totalRuns = 0;
  for (const r of Object.keys(result)) {
    totalTime += result[r].seconds;
    totalRuns += result[r].runs;
  }
  console.log(Object.keys(result).length + " days, note it does not include inactive days");
  console.log(totalTime + "s");
  console.log(totalRuns + " runs");
}

run().then(() => {
    process.exit();
}).catch((err) => {
  console.log(err);
  process.exit(1);
});