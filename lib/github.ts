export async function triggerCodespaceWorkflow(): Promise<{ success: boolean; message: string }> {
  const token =
    process.env.GITHUB_DISPATCH_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER || "tej-mega-third";
  const repo = process.env.GITHUB_REPO_NAME || "cloud-extracter";

  if (!token) {
    return {
      success: false,
      message: "Server configuration missing: GITHUB_DISPATCH_TOKEN is not defined in .env.local",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "trigger_pipeline",
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // GitHub returns 204 No Content on a successful dispatch
    if (response.status === 204 || response.ok) {
      return {
        success: true,
        message: "Codespace wake signal dispatched successfully to GitHub Actions.",
      };
    }

    const errData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errData.message || `GitHub dispatch failed with HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.name === "AbortError" ? "GitHub API request timed out" : error.message || "Network anomaly reaching GitHub API",
    };
  }
}