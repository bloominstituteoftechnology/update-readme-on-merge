const fs = require('fs');
const { execSync } = require('child_process');

const newBranch = `update-readme-${Date.now()}`;
const randomNumber = Math.floor(Math.random() * 1000);

// Checkout a new branch
execSync(`git checkout -b ${newBranch}`);

// Update README.md
const readmeContents = fs.readFileSync('README.md', 'utf8');
const updatedReadme = `${readmeContents}\n\n## Random Number\n${randomNumber}`;
fs.writeFileSync('README.md', updatedReadme);

// Commit and push the changes
execSync('git config user.name "github-actions"');
execSync('git config user.email "github-actions@github.com"');
execSync('git add README.md');
execSync(`git commit -m "Add random number to README"`);
execSync(`git push --set-upstream origin ${newBranch}`);

// Use GitHub API to create a pull request
const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function createPullRequest() {
  await octokit.rest.pulls.create({
    owner: 'YOUR_GITHUB_USERNAME',
    repo: 'YOUR_REPO_NAME',
    title: 'Update README with Random Number',
    head: newBranch,
    base: 'main',
    body: 'This is an automated PR to update the README with a random number.',
  });
}

createPullRequest().catch(console.error);
