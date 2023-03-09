# Set Issue and Pull Request Status on Github Board

[![E2E Test](https://github.com/flexponsive/sync-issue-pr-to-project/actions/workflows/e2e_test.yml/badge.svg)](https://github.com/flexponsive/sync-issue-pr-to-project/actions/workflows/e2e_test.yml)

This action synchronizeses the status of issues and pull requests to a Github projects board. It can add issues and pull requests to projects, and set the status field of the project card corresponding to the issue or pull request.

For example:

- When an issue is created, add it to the Github project board with status "Inbox" at the top of the column

- When a pull request is created, create a Github project card with status "In Development"

- When a review is requested for a pull request, move the Github project card to status "Under Review"

- When a pull request is merged, set the Github project status to "Done"

## Current Status

> NOTE: This action uses the new [ProjectV2 Graphql API](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects), and does not support legacy Github projects (classic)

## Usage: Example for Pull Request Review Automation to Project

```yml
name: When PR review is requested, set project status to Review
on:
  pull_request:
    types:
      - review_requested
      - ready_for_review

jobs:
  project-set-pr-review:
    name: Set PR Review Status on Project Board
    runs-on: ubuntu-latest
    steps:
      - uses: flexponsive/sync-issue-pr-to-project@main
        with:
          project-url: https://github.com/users/flexponsive/projects/4
          github-token: ${{ secrets.PROJECT_TOKEN }}
          new-status: "Review"
          add-to-top-of-column: true
          replace: true
```

## Action Input Settings
The inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | - | - |
| **project-url** | URL of the project to add issues to, e.g. https://github.com/users/my-user-name/projects/12 *(required)* | - |
| **github-token** | Personal Access Token with projects scope *(required)* | - |
| **new-status** | New status, e.g. "In Development" *(required)* | - |
| add-to-top-of-column | Moves the card for this issue to the top of this column | false |
| replace | Try to delete any existing card for the issue/PR before creating a new one. *When replace is true, the github-token must have repo scope* | false |
|  | |  |


# Related Projects

- [actions/add-to-project](https://github.com/actions/add-to-project) is the Github official action which can add both issues and pull requests to a project, and also uses the ProjectV2 API. Setting the status field is not supported ([#71](https://github.com/actions/add-to-project/issues/71))

- [austenstone/project-update](https://github.com/austenstone/project-update) can set arbitrary fields on project cards but uses the deprecated ProjectNext API and probably will not work any more.

- [alex-page/github-project-automation-plus](https://github.com/alex-page/github-project-automation-plus), [leonsteinhaeuser/project-beta-automations](https://github.com/leonsteinhaeuser/project-beta-automations)