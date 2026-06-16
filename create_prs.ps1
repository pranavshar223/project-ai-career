git checkout main
git pull origin main

# --- PR 1: Future Models ---
git checkout -b feature/future-ai-schemas
git checkout stash@{0} -- server/models/Assessment.js server/models/AssessmentAttempt.js server/models/AssessmentQuestion.js server/models/ChatSession.js
git commit -m "feat: add initial schemas for future AI features"
git push -u origin feature/future-ai-schemas
gh pr create --title "feat: add schemas for future AI features" --body "Adds empty Mongoose schemas for Roadmap, Assessment, and Chat features to prepare the database for upcoming AI enhancements." --head feature/future-ai-schemas --base main

# --- PR 2: Schema + Onboarding Updates ---
git checkout main
git checkout -b feature/schema-onboarding-refactor
# pop the stash and restore all other changes
git stash pop

# remove the models from this branch so they aren't included again
git reset HEAD server/models/Assessment.js server/models/AssessmentAttempt.js server/models/AssessmentQuestion.js server/models/ChatSession.js
Remove-Item -Force server/models/Assessment.js -ErrorAction SilentlyContinue
Remove-Item -Force server/models/AssessmentAttempt.js -ErrorAction SilentlyContinue
Remove-Item -Force server/models/AssessmentQuestion.js -ErrorAction SilentlyContinue
Remove-Item -Force server/models/ChatSession.js -ErrorAction SilentlyContinue

git add -A
git commit -m "feat: refactor database schema and integrate onboarding fields"
git push -u origin feature/schema-onboarding-refactor
gh pr create --title "feat: database schema refactor and onboarding integration" --body "Refactors User schema to remove onboardingProfile redundancy and integrates missing onboarding fields into the main profile and AI prompt context." --head feature/schema-onboarding-refactor --base main

# Switch back to original branch
git checkout feature/onboarding-flow-update
