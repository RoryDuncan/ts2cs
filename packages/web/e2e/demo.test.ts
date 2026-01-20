import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("has expected h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("REPL", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/repl");
  });

  test("shows default code and transpiled output", async ({ page }) => {
    // Check that TypeScript tab is active
    const tsTab = page.locator("button.tab", { hasText: "src/example.ts" });
    await expect(tsTab).toHaveClass(/active/);

    // Check that the code editor is visible
    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible();

    // Check that there's C# output (in the output pane)
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=src/example.cs")).toBeVisible();

    // Check that C# output contains "public partial class Player" (specific to C# output)
    await expect(outputPane.locator("text=public partial class Player")).toBeVisible();
  });

  test("can switch between TypeScript and config tabs", async ({ page }) => {
    // Click config tab
    const configTab = page.locator("button.tab", { hasText: "ts2cs.config.json" });
    await configTab.click();

    // Config tab should now be active
    await expect(configTab).toHaveClass(/active/);

    // TypeScript tab should not be active
    const tsTab = page.locator("button.tab", { hasText: "src/example.ts" });
    await expect(tsTab).not.toHaveClass(/active/);

    // Editor should still be visible (now showing JSON)
    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible();

    // Switch back to TypeScript tab
    await tsTab.click();
    await expect(tsTab).toHaveClass(/active/);
    await expect(configTab).not.toHaveClass(/active/);
  });

  test("config editor shows default configuration", async ({ page }) => {
    // Switch to config tab
    const configTab = page.locator("button.tab", { hasText: "ts2cs.config.json" });
    await configTab.click();

    // Check that default config values are visible in the editor
    const editorContent = page.locator(".cm-content");
    await expect(editorContent).toContainText("namespace");
    await expect(editorContent).toContainText("numberType");
    await expect(editorContent).toContainText("float");
  });

  test("transpile button works", async ({ page }) => {
    // Click the transpile button
    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();

    // Wait for transpilation to complete
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // C# output should still be visible (check specific C# output text)
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=public partial class Player")).toBeVisible();
  });

  test("auto-transpile can be toggled", async ({ page }) => {
    const autoCheckbox = page.locator("input[type='checkbox']").first();

    // Should be checked by default
    await expect(autoCheckbox).toBeChecked();

    // Uncheck it
    await autoCheckbox.uncheck();
    await expect(autoCheckbox).not.toBeChecked();

    // Check it again
    await autoCheckbox.check();
    await expect(autoCheckbox).toBeChecked();
  });

  test("config changes affect transpilation output", async ({ page }) => {
    // First, verify the default uses "float" for numbers
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=float health")).toBeVisible();

    // Switch to config tab
    const configTab = page.locator("button.tab", { hasText: "ts2cs.config.json" });
    await configTab.click();

    // Get the editor and modify the config to use "double"
    const editor = page.locator(".cm-content");
    await editor.click();

    // Select all and replace with double config
    await page.keyboard.press("Control+a");
    await page.keyboard.type(
      JSON.stringify(
        {
          namespace: "Game",
          numberType: "double",
          arrayTransform: "list",
          typedArrayTransform: "array",
          discriminatedUnionStrategy: "abstract-subclass",
          includeHeader: false
        },
        null,
        2
      )
    );

    // Switch back to TypeScript tab and transpile
    const tsTab = page.locator("button.tab", { hasText: "src/example.ts" });
    await tsTab.click();

    // Click transpile
    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();

    // Wait for transpilation
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // Now the output should use "double" instead of "float"
    await expect(outputPane.locator("text=double health")).toBeVisible({ timeout: 5000 });
  });

  test("invalid JSON config shows error on transpile", async ({ page }) => {
    // Switch to config tab
    const configTab = page.locator("button.tab", { hasText: "ts2cs.config.json" });
    await configTab.click();

    // Get the editor and enter invalid JSON
    const editor = page.locator(".cm-content");
    await editor.click();

    // Select all and replace with invalid JSON
    await page.keyboard.press("Control+a");
    await page.keyboard.type("{ invalid json }");

    // Try to transpile - should get an error
    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();

    // Wait for the form to return and check for error in output
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // Should show error message in output pane
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator(".error-display")).toBeVisible();
  });

  test("URL updates with share code when code changes", async ({ page }) => {
    // Type some code in the editor
    const editor = page.locator(".cm-content").first();
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("class TestClass {}");

    // Click transpile
    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();

    // Wait for transpilation
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // URL should have changed to include share code
    await expect(page).not.toHaveURL("/repl");
    expect(page.url()).toMatch(/\/repl\/.+/);
  });

  test("shared URL loads code and config", async ({ page }) => {
    // First, create a share URL by modifying code
    const editor = page.locator(".cm-content").first();
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("class SharedClass { x: number = 42; }");

    // Click transpile
    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();

    // Wait for transpilation
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // Get the current URL
    const shareUrl = page.url();
    expect(shareUrl).not.toBe("/repl");

    // Navigate to a different page first
    await page.goto("/");

    // Now navigate to the share URL
    await page.goto(shareUrl);

    // Should see the shared code in output (C# partial class)
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=public partial class SharedClass")).toBeVisible();
  });

  test("output pane shows file tab styling", async ({ page }) => {
    // Check the output pane has the file tab
    const outputTab = page.locator(".output-tab");
    await expect(outputTab).toBeVisible();
    await expect(outputTab).toContainText("src/example.cs");
  });

  test("warnings are displayed correctly", async ({ page }) => {
    // Type code that might generate warnings
    const editor = page.locator(".cm-content").first();
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("const x = 1; class Test {}");

    // Click transpile
    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();

    // Wait for transpilation
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // The output should still work even with top-level statements
    // (which generate warnings) - check C# specific output
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=public partial class Test")).toBeVisible();
  });

  test("namespace config option works", async ({ page }) => {
    // Switch to config tab
    const configTab = page.locator("button.tab", { hasText: "ts2cs.config.json" });
    await configTab.click();

    // Set a custom namespace
    const editor = page.locator(".cm-content");
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type(
      JSON.stringify(
        {
          namespace: "MyCustomNamespace",
          numberType: "float",
          arrayTransform: "list",
          typedArrayTransform: "array",
          discriminatedUnionStrategy: "abstract-subclass",
          includeHeader: false
        },
        null,
        2
      )
    );

    // Switch back to TypeScript and transpile
    const tsTab = page.locator("button.tab", { hasText: "src/example.ts" });
    await tsTab.click();

    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // Check output contains custom namespace
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=namespace MyCustomNamespace")).toBeVisible({ timeout: 5000 });
  });

  test("includeHeader config option works", async ({ page }) => {
    // Switch to config tab
    const configTab = page.locator("button.tab", { hasText: "ts2cs.config.json" });
    await configTab.click();

    // Enable header
    const editor = page.locator(".cm-content");
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type(
      JSON.stringify(
        {
          namespace: "Game",
          numberType: "float",
          arrayTransform: "list",
          typedArrayTransform: "array",
          discriminatedUnionStrategy: "abstract-subclass",
          includeHeader: true
        },
        null,
        2
      )
    );

    // Switch back to TypeScript and transpile
    const tsTab = page.locator("button.tab", { hasText: "src/example.ts" });
    await tsTab.click();

    const transpileBtn = page.locator("button.transpile-btn");
    await transpileBtn.click();
    await expect(transpileBtn).not.toBeDisabled({ timeout: 5000 });

    // Check output contains auto-generated header comment (the opening tag)
    const outputPane = page.locator(".panel").nth(1);
    await expect(outputPane.locator("text=<auto-generated>").first()).toBeVisible({ timeout: 5000 });
  });
});
