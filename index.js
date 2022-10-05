const core = require("@actions/core");
const github = require("@actions/github");
const { graphql } = require("@octokit/graphql");

const githubToken = core.getInput("github-token");

const inputs = {
	projectUrl: core.getInput("project-url"),
	newStatusName: core.getInput("new-status"),
	addToTopOfColumn: ["true", "1", "yes"].includes(
		core.getInput("add-to-top-of-column")
	),
	issueNodeId: (
		github.context.payload.issue ?? github.context.payload.pull_request
	).node_id,
};

core.debug(`INPUTS ${JSON.stringify(inputs)}`);

const octokitGraphql = graphql.defaults({
	headers: {
		authorization: `token ${githubToken}`,
	},
});

try {
	main().then(() => console.log("really done"));
} catch (error) {
	core.setFailed(error.message ?? error);
}

async function main() {
	// STEP 1: Get project details
	const projectDetails = await getProjectDetails(
		octokitGraphql,
		inputs.projectUrl
	);
	const newStatus = projectDetails.status.options.find(
		(s) => s.name == inputs.newStatusName
	);
	if (!newStatus) {
		throw new Error(
			`Column with name ${inputs.newStatusName} was not found in the project board`
		);
	}

	// STEP 2: Add our Issue/PR to that project board.
	const addIssueToProject = await octokitGraphql(
		`mutation addIssueToProject($input: AddProjectV2ItemByIdInput!) {
			addProjectV2ItemById(input: $input) {
				item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectDetails.projectNodeId,
				contentId: inputs.issueNodeId,
			},
		}
	);
	core.debug(`ADDISSUETOPROJECT ${JSON.stringify(addIssueToProject)}`);
	const cardNodeId = addIssueToProject.addProjectV2ItemById.item.id;
	core.setOutput("card-node-id", cardNodeId);

	// STEP 3: Set status of the card
	const updateProjectV2ItemFieldValue = await octokitGraphql(
		`mutation ( $input: UpdateProjectV2ItemFieldValueInput! ) {
			set_status: updateProjectV2ItemFieldValue( input: $input ) {
				projectV2Item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectDetails.projectNodeId,
				itemId: cardNodeId,
				fieldId: projectDetails.status.id,
				value: {
					singleSelectOptionId: newStatus.id,
				},
			},
		}
	);
	console.log(updateProjectV2ItemFieldValue);

	// STEP 4: Move to top of the column if required
	if (inputs.addToTopOfColumn) {
		const updateProjectV2ItemPosition = await octokitGraphql(
			`mutation ( $input: UpdateProjectV2ItemPositionInput! ) {
                updateProjectV2ItemPosition( input: $input ) {
                    clientMutationId
                }
            }`,
			{
				input: {
					projectId: projectDetails.projectNodeId,
					itemId: cardNodeId,
				},
			}
		);
		console.log(updateProjectV2ItemPosition);
	}

	// Get the JSON webhook payload for the event that triggered the workflow
	const payload = JSON.stringify(github.context.payload, undefined, 2);
	console.log(`The event payload: ${payload}`);
}

/**
 * Get Information about a project board.
 * Based on: https://jeremy.hu/github-actions-javascript-action-part-3/
 *
 * @param {GitHub} octokitGraphql  - Initialized Octokit GraphQL client.
 * @param {string} projectBoardLink - The link to the project board.
 * @returns {Promise<Object>} - Project board information.
 */
async function getProjectDetails(octokitGraphql, projectBoardLink) {
	const projectRegex =
		/^(?:https:\/\/)?github\.com\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/;
	const matches = projectBoardLink.match(projectRegex);
	if (!matches) {
		throw new Error(
			"board not found - maybe board link is invalid or no access available"
		);
	}

	const {
		groups: { ownerType, ownerName, projectNumber },
	} = matches;

	const projectInfo = {
		ownerType: ownerType === "orgs" ? "organization" : "user", // GitHub API requests require 'organization' or 'user'.
		ownerName,
		projectNumber: parseInt(projectNumber, 10),
	};

	// First, use the GraphQL API to request the project's node ID,
	// as well as info about the first 20 fields for that project.
	const projectDetails = await octokitGraphql(
		`query getProject($ownerName: String!, $projectNumber: Int!) {
			${projectInfo.ownerType}(login: $ownerName) {
				projectV2(number: $projectNumber) {
					id
					fields(first:20) {
						nodes {
							... on ProjectV2SingleSelectField {
								id
								name
								options {
									id
									name
								}
							}
						}
					}
				}
			}
		}`,
		{
			ownerName: projectInfo.ownerName,
			projectNumber: projectInfo.projectNumber,
		}
	);

	// Extract the project node ID.
	const projectNodeId = projectDetails[projectInfo.ownerType]?.projectV2.id;
	if (projectNodeId) {
		projectInfo.projectNodeId = projectNodeId; // Project board node ID. String.
	}

	// Extract the ID of the Status field.
	const statusField = projectDetails[
		projectInfo.ownerType
	]?.projectV2.fields.nodes.find((field) => field.name === "Status");
	if (statusField) {
		projectInfo.status = statusField; // Info about our status column (id as well as possible values).
	}

	core.debug(`GETPROJECTDETAILS ${JSON.stringify(projectInfo)}`);
	return projectInfo;
}
