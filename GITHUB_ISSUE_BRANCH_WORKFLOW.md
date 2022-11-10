# Github Customized Issue Branch Workflow

## The Customized Workflow

**1. Create a new issue**

Create a new issue to start a discussion. Use comments / checklists etc. to clarify and specify what the issue should be about.

*Custom Automation*: When an issue is created, it is added to the top of the "In Discussion" column on the project board. 

**2. Mark as ready**

When the team determines that the issue has met the definition of ready, move the issue to the "Ready" column on the board.

(No automation needed)

**3. Start development: Create issue branch and automatically convert to pull request**

Before starting to work on an issue, create an [issue branch](https://github.com/github/roadmap/issues/218)

*Custom Automation*:
1. Using the [auto_pr_for_issue_branch.yml](.github/workflows/auto_pr_for_issue_branch.yml) action, make an empty commit to the issue branch. Then convert the issue to a (draft) pull request using the hub cli tool.

2. Replace the existing project card for the issue with a new issue card for the pull request, and move this card to "In Development" on the project board, using the [flexponsive/sync-issue-pr-to-project](http://github.com/flexponsive/sync-issue-pr-to-project) Github action.

**4. Request review of pull request**

When coding is finished, click on "request review" or select a reviewer in the sidebar

*Custom Automation*: Move the project card of the pull request into the "Review" column.

**5. Merge completed**

After review, the pull request is merged

*Custom Automation*: Move the project card to the done column.

## Comparison to Github native workflow (as of November 2022)

**Issue Branches**

Github can create [issue branches](https://github.com/github/roadmap/issues/218), and suggest a default branch name format (123-my-issue-title). When commits are made in the branch, these are shown in the issue (similar to a pull request). But there is no way to easily view the code of the issue branch or attach comments to code as with a pull request. In order to have this functionality, one needs to manually create a pull request for the issue branch.

Limitations of the current native functionality:

- Confusing naming: pull request id, say, 125, will refer to 123-my-issue branch
- No good way to view or discuss issue branch code changes before a pull request is created
- Pull request duplicates some features of the issue: 
  - Which comment should be made in the issue, which in the PR?
  - Should the PR repeat the description of the issue? Have no description?
- Unclear where to place PR and issue on the project board
  - Should both PR and issue be on the project board?
  - While a PR is "in development", where should the issue be on the board?
- Issue branches cannot use github actions reserved for pull requests

**Issue and Pull Request Integration with Project Boards**

Currently, [built-in github project workflows](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations) are available in "limited beta".

This allows creation of workflows like "if an item is added to the project, set status to ready", and a couple of more triggers.

Limitations of the beta:

- Cannot automatically add item to project (needs github action)
- Cannot assign different status to issues and pull requests (e.g. new issues should go to Ready, new pull request goes to In Development)


