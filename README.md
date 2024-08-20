# fetch_gold_exercise

A repository dedicated to solving a single exercise relating to gold bars. The puzzle in question will be solved via e2e automation using Playwright as our testing library.

# Setup
This setup will assume that you, the reader, have never ran this application. Or possibly any application. If so, please ensure that the following items are installed before proceeding.

## Git
Git will be required to clone this repository.

* Windows - For Windows users, you may download the installer provided here, as needed for your CPU architecture: https://git-scm.com/download/win
* Mac/OSX - For Mac/OSX users, refer to the following guide for installing `git`: https://git-scm.com/download/mac
* Linux/*nix - For Linux users, refer to the following listing for the correct install command, as determined by your distribution: https://git-scm.com/download/linux

## Node
At minimum, an LTS version of NodeJS will be required to run `npm`, and by extension, Playwright. This guide suggests a system-specific NodeJS install command provided via the official website: https://nodejs.org/en/download/package-manager

On this site, ensure that you have an LTS version of NodeJS (indicated by an 'LTS' in the version name) selected in the first dropdown. You will also need to select your operating system in the second dropdown. After doing so, the site will provide a dynamically-generated set of commands to run to install NodeJS to your system.

Depending on your operating system, you will either use NVM (Node Version Manager) or FNM (Fast Node Manager) to setup and maintain your NodeJS installation. **You may need to reboot before proceeding to the next step**.

### Manual install via nvm
If you already have NVM on your system, or if NVM was installed without setting a Node version, you can manually install the latest NodeJS LTS via the following commands:
```
nvm install --lts
nvm use --lts
```

## Playwright
If you have already cloned this repository, from a command line, execute the following command from the root directory of the repository:
```
npm i
```

### Fresh install
You may also freshly install Playwright via `npm` using the following command:
```
npm init playwright@latest
```

Select the default for all prompts provided. When prompted for a language, select `Typescript`.

# Running the tests
To run the test suite, execute the following command from the command line of your choice (preferably the one you've used to set up your environment in the previous steps):
```
npx playwright test src/tests/goldBars.spec.ts
```
