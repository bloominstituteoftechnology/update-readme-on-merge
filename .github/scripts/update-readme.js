const fs = require('fs');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY_OWNER = process.env.GITHUB_REPOSITORY_OWNER;
const GITHUB_REPOSITORY_NAME = process.env.GITHUB_REPOSITORY_NAME;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const newBranch = `update-readme-${Date.now()}`;
const randomNumber = Math.floor(Math.random() * 1000);

// Update README.md
execSync(`git checkout -b ${newBranch}`);
const readmeContents = fs.readFileSync('README.md', 'utf8');
const updatedReadme = `${readmeContents}\n\n## Random Number\n${randomNumber}`;
fs.writeFileSync('README.md', updatedReadme);

execSync('git config user.name "github-actions"');
execSync('git config user.email "github-actions@github.com"');
execSync('git add README.md');
execSync(`git commit -m "Add random number to README"`);
execSync(`git push --set-upstream origin ${newBranch}`);

async function createPullRequest() {
  await octokit.rest.pulls.create({
    owner: GITHUB_REPOSITORY_OWNER,
    repo: GITHUB_REPOSITORY_NAME,
    title: 'Update README with Random Number',
    head: newBranch,
    base: 'main',
    body: 'This is an automated PR to update the README with a random number.',
  });
}

createPullRequest().catch(console.error);
