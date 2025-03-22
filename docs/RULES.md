# Project Rules and Guidelines

## Versioning Guidelines

This project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) with the following specific rules:

1. **Version Format**: MAJOR.MINOR.PATCH (e.g., 1.2.3)
   - **MAJOR**: Increment for incompatible API changes
   - **MINOR**: Increment for backward-compatible functionality additions
   - **PATCH**: Increment for backward-compatible bug fixes

2. **Git Tags**:
   - All releases must be tagged in git with the format: `MAJOR.MINOR.PATCH` (without 'v' prefix)
   - Example: `0.5.1` not `v0.5.1`

3. **CHANGELOG Management**:
   - Every version must have an entry in CHANGELOG.md
   - The topmost section should always be `[Unreleased]` for upcoming changes
   - The current version should be labeled as "Current Version" instead of a date
   - Avoid future dates in the CHANGELOG

4. **Version Consistency**:
   - All version references must be synchronized between:
     - Git tags
     - CHANGELOG.md
     - Documentation files
     - In-game version display
   
5. **Pre-releases**:
   - Alpha releases: `MAJOR.MINOR.PATCH-alpha.N` (e.g., `0.6.0-alpha.1`)
   - Beta releases: `MAJOR.MINOR.PATCH-beta.N` (e.g., `0.6.0-beta.1`)

6. **Version Checking**:
   - Before any release, run `git tag -l` to check existing tags
   - Ensure the new version follows the sequence and adheres to semantic versioning principles

## Development Workflow

[Additional existing rules would continue here...] 