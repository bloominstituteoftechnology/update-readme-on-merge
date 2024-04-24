const fs = require('fs');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');
const { OpenAI } = require('openai');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_REPOSITORY_OWNER = process.env.GITHUB_REPOSITORY_OWNER;
const GITHUB_REPOSITORY_NAME = process.env.GITHUB_REPOSITORY_NAME;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function summarizeDiff(pullNumber) {
  const { data: diffData } = await octokit.rest.pulls.get({
    owner: GITHUB_REPOSITORY_OWNER,
    repo: GITHUB_REPOSITORY_NAME,
    pull_number: pullNumber,
    mediaType: { format: 'diff' },
  });

  const { data: chatCompletion, response: raw } = await openai.chat.completions
    .create({
      messages: [{ role: 'user', content: "Summarize this diff:\n" + diffData }],
      model: 'gpt-3.5-turbo',
    })
    .withResponse();

  return JSON.stringify(chatCompletion);
}

async function updateReadmeAndCreatePR() {
  const pullNumber = process.env.GITHUB_PULL_REQUEST_NUMBER;
  const summary = await summarizeDiff(pullNumber);
  const newBranch = `update-readme-${Date.now()}`;

  execSync(`git checkout -b ${newBranch}`);
  const readmeContents = fs.readFileSync('README.md', 'utf8');
  const updatedReadme = `${readmeContents}\n\n## Pull Request Summary\n${summary}`;
  fs.writeFileSync('README.md', updatedReadme);

  execSync('git config user.name "github-actions"');
  execSync('git config user.email "github-actions@github.com"');
  execSync('git add README.md');
  execSync(`git commit -m "Update README with PR Summary"`);
  execSync(`git push --set-upstream origin ${newBranch}`);

  await octokit.rest.pulls.create({
    owner: GITHUB_REPOSITORY_OWNER,
    repo: GITHUB_REPOSITORY_NAME,
    title: 'Update README with PR Summary',
    head: newBranch,
    base: 'main',
    body: 'This is an automated PR to update the README with a summary of the latest merged PR.',
  });
}

updateReadmeAndCreatePR().catch(console.error);
