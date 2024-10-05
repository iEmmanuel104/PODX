# **Shortlet-Lagos Git Workflow Documentation**
Git Repository Structure

Our project follows this workflow to manage code changes and releases. The  branches in the repository are:

```
main: Represents the production-ready code.
feature: Used for developing  features .
release: Used for final testing and preparing for a new release.

```

**Branch Naming Conventions**

```
Feature Branches: feature/feature-name
Release Branches: release/version-number

```

Workflow Overview

1. Feature Development
    
    Create a New Feature Branch:
    
    bash
    

git checkout -b feature/feature-name

Work on Your Feature:

```
Make changes, commit locally, and push the feature branch to the remote repository.

```

bash

git add .
git commit -m "Feature: Description of the feature"
git push origin feature/feature-name

Open a Pull Request:

```
On the repository hosting platform (e.g., GitHub), open a pull request from the feature branch to the main branch.

```

Code Review:

```
Request code reviews from team members.
Address feedback and make necessary changes.

```

Approval and Merge:

```
After approval, merge the feature branch into the main branch.

```

bash

```
git checkout main
git pull origin main
git merge --no-ff feature/feature-name
git push origin main

```

1. Release Preparation
    
    Create a New Release Branch:
    
    bash
    

git checkout -b release/version-number

Final Testing and Bug Fixes:

```
Perform final testing and address any critical issues.

```

Open a Pull Request:

```
On the repository hosting platform (e.g., GitHub), open a pull request from the release branch to the main branch.

```

Code Review:

```
Request code reviews to ensure the stability of the release.
Address feedback and make necessary changes.

```

Approval and Merge:

```
After approval, merge the release branch into the main branch.

```

bash

```
git checkout main
git pull origin main
git merge --no-ff release/version-number
git push origin main

```

1. Hotfixes (if needed)
    
    Create a New Hotfix Branch:
    
    bash
    

git checkout -b hotfix/fix-description

Work on the Hotfix:

```
Make necessary changes, commit, and push the hotfix branch.

```

bash

git add .
git commit -m "Hotfix: Description of the fix"
git push origin hotfix/fix-description

Open a Pull Request:

```
On the repository hosting platform (e.g., GitHub), open a pull request from the hotfix branch to the main branch.

```

Code Review:

```
Request code reviews to ensure the correctness of the hotfix.
Address feedback and make necessary changes.

```

Approval and Merge:

```
After approval, merge the hotfix branch into the main branch.

```

bash

git checkout main
git pull origin main
git merge --no-ff hotfix/fix-description
git push origin main
