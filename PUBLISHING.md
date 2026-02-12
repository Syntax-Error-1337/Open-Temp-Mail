# Publishing a New Release

This project uses **GitHub Actions** to automatically build and release the application.

## How to Create a Release

1.  **Update Version**: Bump the version in `package.json` (e.g., `1.0.0` -> `1.0.1`).
2.  **Commit**: Commit the change.
    ```bash
    git commit -am "chore: bump version to 1.0.1"
    ```
3.  **Tag**: Create a new tag starting with `v`.
    ```bash
    git tag v1.0.1
    ```
4.  **Push**: Push the commit and the tag to GitHub.
    ```bash
    git push && git push --tags
    ```

## What Happens Next?

-   GitHub Actions will detect the new tag.
-   It will build the project (`npm run build`).
-   It will zip the `dist/` folder.
-   It will create a new **Release** in the GitHub repository.
-   The zipped assets will be attached to the release for download.
