# Template Setup Guide for AI Agents

This is a template project that needs to be customized for a new project. Before proceeding, ensure you have the following information from the user:

**Required Context:**
- **Project name**: The name of the new project (kebab-case for files/folders, PascalCase for display)
- **Project description**: A one-liner explaining what the project does
- **Repo URL**: Or something like someaccount/somerepo

If this information is not in context, **ask the user for it before proceeding**.

---

## Setup Checklist

Complete these tasks to transform the template into the new project:

1. **Replace template name with project name**
   - Search for "helloworld" (case-insensitive) across the codebase
   - Replace with the actual project name in appropriate casing
   - Update workspace file names (e.g., `helloworld.code-workspace` → `[project-name].code-workspace`)

2. **Update zap.yaml**
   - Change the project name in the zap configuration
   - Verify process names match the new project

3. **Configure port numbers**
   - Assign unique port numbers for frontend and backend
   - Update all references in config files
   - Ensure no conflicts with other local projects

4. **Rewrite README.md**
   - Add project title and description
   - Document the project's purpose and features
   - Include setup and development instructions
   - Keep it concise but informative

5. **Write AGENTS.md**
   - Document project architecture and structure
   - Include coding patterns and conventions
   - Add context that will help AI agents work on this project
   - Reference any special considerations or gotchas

6. **Assign random ports**
For each app, assign a random port so that it doesn't clash with other projects. Make sure to find and replace across the whole repo.

6. **Update render.yaml**
   - Set project name
   - Set all the repo URLs to the new repo

7. **Update branding**
   - Replace favicon in `apps/frontend/public/`
   - Update page title in `apps/frontend/index.html`
   - Ensure branding matches the project identity

8. **Clean up**
   - Delete this PROJECT_SETUP_GUIDE.md file
   - Remove any other template artifacts
   - Verify the project is ready for development


**After completing this checklist, the project should be fully customized and ready for development.**
