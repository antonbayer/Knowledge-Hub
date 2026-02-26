#!/usr/bin/env node
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { parseGitUrl, findGitRepos } = require("./vault.js");

// ─── parseGitUrl ────────────────────────────────────────────

describe("parseGitUrl", () => {
  it("parses SSH URLs", () => {
    const result = parseGitUrl("git@github.com:user/project.git");
    assert.equal(result.org, "user");
    assert.equal(result.projectPath, "project");
  });

  it("parses SSH URLs without .git suffix", () => {
    const result = parseGitUrl("git@github.com:user/project");
    assert.equal(result.org, "user");
    assert.equal(result.projectPath, "project");
  });

  it("parses HTTPS URLs", () => {
    const result = parseGitUrl("https://github.com/user/project.git");
    assert.equal(result.org, "user");
    assert.equal(result.projectPath, "project");
  });

  it("parses HTTPS URLs without .git suffix", () => {
    const result = parseGitUrl("https://github.com/user/project");
    assert.equal(result.org, "user");
    assert.equal(result.projectPath, "project");
  });

  it("parses nested paths", () => {
    const result = parseGitUrl("git@github.com:org/group/project.git");
    assert.equal(result.org, "org");
    assert.equal(result.projectPath, "group/project");
  });

  it("parses HTTP URLs", () => {
    const result = parseGitUrl("http://gitlab.local/team/repo.git");
    assert.equal(result.org, "team");
    assert.equal(result.projectPath, "repo");
  });

  it("exits on invalid URL", () => {
    assert.throws(
      () => {
        // parseGitUrl calls process.exit(1) on invalid input.
        // Override process.exit to throw instead.
        const original = process.exit;
        process.exit = (code) => { throw new Error("exit:" + code); };
        try {
          parseGitUrl("not-a-url");
        } finally {
          process.exit = original;
        }
      },
      { message: "exit:1" }
    );
  });
});

// ─── findGitRepos ───────────────────────────────────────────

describe("findGitRepos", () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-test-"));

    // Create fake repo structure:
    //   repoA/.git/
    //   group/repoB/.git/
    //   not-a-repo/
    //   node_modules/hidden/.git/   (should be skipped)
    fs.mkdirSync(path.join(tmpDir, "repoA", ".git"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "group", "repoB", ".git"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "not-a-repo"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "node_modules", "hidden", ".git"), { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds repos recursively", () => {
    const repos = findGitRepos(tmpDir);
    const names = repos.map((r) => path.relative(tmpDir, r)).sort();
    assert.deepEqual(names, ["group" + path.sep + "repoB", "repoA"]);
  });

  it("does not descend into .git or node_modules", () => {
    const repos = findGitRepos(tmpDir);
    const hasNodeModules = repos.some((r) => r.includes("node_modules"));
    assert.equal(hasNodeModules, false);
  });

  it("returns empty array for non-existent directory", () => {
    const repos = findGitRepos(path.join(tmpDir, "does-not-exist"));
    assert.deepEqual(repos, []);
  });

  it("does not recurse into found repos", () => {
    // Add a nested .git inside repoA — should not be found as separate repo
    fs.mkdirSync(path.join(tmpDir, "repoA", "sub", ".git"), { recursive: true });
    const repos = findGitRepos(tmpDir);
    const hasNested = repos.some((r) => r.includes("sub"));
    assert.equal(hasNested, false);
  });
});
