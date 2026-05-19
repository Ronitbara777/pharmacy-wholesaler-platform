# Project Commands Guide

This document contains a list of useful commands for managing the project, including Docker, Git, and other operations.

## Docker Commands

### Start PostgreSQL Database
If the application cannot connect to the database (e.g., retrieving data fails), the Docker container might be stopped. Start it with:
```bash
docker start pharmacy-postgres
```

### Check Running Containers
To check if the database or other containers are running:
```bash
docker ps
```
To check specifically for the pharmacy postgres container:
```bash
docker ps --filter "name=pharmacy-postgres"
```

### Check All Containers (including stopped ones)
```bash
docker ps -a
```

## Git Commands

### Add Changes
To stage all modified and new files for the next commit:
```bash
git add .
```
To add a specific file:
```bash
git add <file_path>
```

### Commit Changes
To save the staged changes with a descriptive message:
```bash
git commit -m "Your descriptive commit message here"
```

### Push Changes
To push your committed changes to the remote repository (e.g., GitHub, GitLab):
```bash
git push origin <branch_name>
```
*Note: If you are on the main branch, use `git push origin main` or `git push origin master` depending on your default branch name.*

### Pull Changes
To fetch and merge the latest changes from the remote repository to your local machine:
```bash
git pull origin <branch_name>
```

### Check Repository Status
To see the current state of your working directory and staging area:
```bash
git status
```

---
*Feel free to request any additional commands to be added to this document.*
