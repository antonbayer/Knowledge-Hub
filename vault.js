#!/usr/bin/env node
/**
 * vault.js — Manage the Knowledge Vault
 *
 * Commands:
 *   node vault.js pull                  Pull all repos + create junctions
 *   node vault.js add <git-url>         Clone a new project + link it
 *   node vault.js add <url> --link <p>  With explicit vault path
 *   node vault.js status                Show status of all repos
 *
 * .env:
 *   SOURCES=C:\path\to\repos             Comma-separated for multiple
 *   TEMPLATES=path/to/templates
 *   ASSETS=path/to/assets
 *
 * Logic:
 *   Recursively find all Git repos under each SOURCES path.
 *   Create a junction in the vault for each repo.
 *   Vault path = path relative to the source directory.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const VAULT_ROOT = __dirname;
const ENV_FILE = path.join(VAULT_ROOT, ".env");
const LINK_TYPE = process.platform === "win32" ? "junction" : "symlink";

// ─── Helpers ────────────────────────────────────────────────

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error(".env not found: " + ENV_FILE);
    console.error("Copy .env.example to .env and adjust the paths.");
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function getSrcDirs(env) {
  if (!env.SOURCES) {
    console.error("SOURCES not defined in .env.");
    process.exit(1);
  }
  return env.SOURCES.split(",").map(s => path.resolve(VAULT_ROOT, s.trim()));
}

function hasCommand(name) {
  try {
    execSync(process.platform === "win32" ? `where ${name}` : `which ${name}`, { stdio: "pipe" });
    return true;
  } catch (e) {
    return false;
  }
}

function ensureTools() {
  const tools = [
    { cmd: "git",    install: null }, // must be installed manually
    { cmd: "marp",   install: "npm install -g @marp-team/marp-cli" },
    { cmd: "pandoc", install: "winget install --id JohnMacFarlane.Pandoc -e" },
  ];

  for (const { cmd, install } of tools) {
    if (hasCommand(cmd)) continue;
    if (!install) {
      console.error(cmd + " not found. Please install it manually.");
      process.exit(1);
    }
    console.log(cmd + " not found — installing...");
    try {
      execSync(install, { stdio: "inherit" });
      console.log(cmd + " installed.");
    } catch (e) {
      console.error(cmd + " installation failed. Manual: " + install);
      process.exit(1);
    }
  }
}

function gitExec(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch (e) {
    return false;
  }
}

function ensureLink(linkPath, targetPath) {
  if (fs.existsSync(linkPath)) return "exists";
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  try {
    if (process.platform === "win32") {
      execSync(`mklink /J "${linkPath}" "${targetPath}"`, {
        stdio: "pipe",
        shell: "cmd.exe",
      });
    } else {
      fs.symlinkSync(targetPath, linkPath, "dir");
    }
    return "created";
  } catch (e) {
    return "failed";
  }
}

/**
 * Recursively find all Git repos.
 * Stops recursion when a .git folder is found.
 */
function findGitRepos(dir) {
  const repos = [];
  if (!fs.existsSync(dir)) return repos;

  function walk(d) {
    if (fs.existsSync(path.join(d, ".git"))) {
      repos.push(d);
      return; // stop — don't go deeper
    }
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        walk(path.join(d, entry.name));
      }
    }
  }

  walk(dir);
  return repos;
}

// ─── URL Parsing ────────────────────────────────────────────

function parseGitUrl(url) {
  const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  const httpsMatch = url.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/);

  let repoPath;
  if (sshMatch) {
    repoPath = sshMatch[2];
  } else if (httpsMatch) {
    repoPath = httpsMatch[2];
  } else {
    console.error("Cannot parse URL: " + url);
    console.error("Expected: git@host:path.git or https://host/path.git");
    process.exit(1);
  }

  const segments = repoPath.split("/");
  const org = segments[0];
  const projectPath = segments.slice(1).join("/");

  return { org, projectPath };
}

// ─── Commands ───────────────────────────────────────────────

function cmdPull() {
  const env = loadEnv();
  const srcDirs = getSrcDirs(env);

  console.log("=== Pulling vault ===");
  gitExec(`git -C "${VAULT_ROOT}" pull`);
  console.log("");

  let allRepos = [];
  for (const srcDir of srcDirs) {
    const repos = findGitRepos(srcDir);
    for (const repoPath of repos) {
      allRepos.push({ repoPath, srcDir });
    }
  }

  if (allRepos.length === 0) {
    console.log("No repos found under: " + srcDirs.join(", "));
    return;
  }

  let created = 0;
  for (const { repoPath, srcDir } of allRepos) {
    const relative = path.relative(srcDir, repoPath);
    const linkPath = path.join(VAULT_ROOT, relative);

    process.stdout.write("  " + relative + " ... ");
    const ok = gitExec(`git -C "${repoPath}" pull`);
    if (!ok) console.warn("  Pull failed.");

    const status = ensureLink(linkPath, repoPath);
    if (status === "created") {
      console.log("  " + LINK_TYPE + " created.");
      created++;
    }
  }

  console.log("");
  console.log(allRepos.length + " repos pulled" + (created > 0 ? ", " + created + " " + LINK_TYPE + "s created" : "") + ".");
}

function cmdAdd(url, linkOverride) {
  const env = loadEnv();
  const srcDirs = getSrcDirs(env);
  const cloneBase = srcDirs[0];

  const parsed = parseGitUrl(url);
  const clonePath = path.join(cloneBase, parsed.projectPath);
  const vaultLink = linkOverride || parsed.projectPath;

  console.log("");
  console.log("  Git URL:     " + url);
  console.log("  Project:     " + parsed.projectPath);
  console.log("  Clone to:    " + clonePath);
  console.log("  Vault link:  " + vaultLink);
  console.log("");

  if (fs.existsSync(clonePath)) {
    console.log("Repo exists — pulling...");
    gitExec(`git -C "${clonePath}" pull`);
  } else {
    console.log("Cloning...");
    fs.mkdirSync(path.dirname(clonePath), { recursive: true });
    if (!gitExec(`git clone "${url}" "${clonePath}"`)) {
      console.error("Clone failed!");
      process.exit(1);
    }
  }

  const linkAbsolute = path.join(VAULT_ROOT, vaultLink);
  const status = ensureLink(linkAbsolute, clonePath);
  if (status === "created") console.log(LINK_TYPE + " created.");
  else if (status === "exists") console.log(LINK_TYPE + " already exists.");
  else {
    console.error(LINK_TYPE + " failed! Create manually:");
    if (process.platform === "win32") {
      console.error(`  mklink /J "${linkAbsolute}" "${clonePath}"`);
    } else {
      console.error(`  ln -s "${clonePath}" "${linkAbsolute}"`);
    }
    process.exit(1);
  }

  console.log("");
  console.log("Done: " + linkAbsolute);
}

function cmdStatus() {
  const env = loadEnv();
  const srcDirs = getSrcDirs(env);

  console.log("");
  console.log("Sources: " + srcDirs.join(", "));
  console.log("");

  let ok = 0, missing = 0, total = 0;
  for (const srcDir of srcDirs) {
    const repos = findGitRepos(srcDir);
    for (const repoPath of repos) {
      const relative = path.relative(srcDir, repoPath);
      const linkPath = path.join(VAULT_ROOT, relative);
      const linked = fs.existsSync(linkPath);

      console.log("  " + (linked ? "OK" : "--") + "  " + relative);
      if (linked) ok++; else missing++;
      total++;
    }
  }

  console.log("");
  console.log(total + " repos (" + ok + " linked, " + missing + " without " + LINK_TYPE + ").");
}

// ─── Exports (for testing) ───────────────────────────────────

module.exports = { loadEnv, getSrcDirs, parseGitUrl, findGitRepos, ensureLink };

// ─── CLI ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log("vault.js — Manage the Knowledge Vault\n");
    console.log("  node vault.js pull                  Pull repos + create links");
    console.log("  node vault.js add <git-url>         Clone a new project + link it");
    console.log("  node vault.js add <url> --link <p>  With explicit vault path");
    console.log("  node vault.js status                Show status of all repos\n");
    console.log(".env:");
    console.log("  SOURCES=C:\\path\\to\\repos");
    console.log("  TEMPLATES=path/to/templates");
    console.log("  ASSETS=path/to/assets");
    process.exit(0);
  }

  ensureTools();

  switch (command) {
    case "pull":
      cmdPull();
      break;
    case "add": {
      const url = args[1];
      if (!url) { console.error("Missing: Git URL"); process.exit(1); }
      const li = args.indexOf("--link");
      cmdAdd(url, li !== -1 ? args[li + 1] : null);
      break;
    }
    case "status":
      cmdStatus();
      break;
    default:
      console.error("Unknown: " + command + " (--help for help)");
      process.exit(1);
  }
}
