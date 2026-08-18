import { test, expect } from "@playwright/test";

test("primary navigation works in the real browser", async ({ page }) => {
  await page.goto("/#home");
  await expect(page.getByRole("heading", { name: "今天学什么，系统已经排好了" })).toBeVisible();
  await page.getByRole("button", { name: "学习", exact: true }).first().click();
  await expect(page).toHaveURL(/#learn$/);
  await expect(page.getByRole("heading", { name: "学习", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "复习", exact: true }).first().click();
  await expect(page).toHaveURL(/#review$/);
  await page.getByRole("button", { name: "内容库", exact: true }).first().click();
  await expect(page).toHaveURL(/#library$/);
  await page.getByRole("button", { name: "进度", exact: true }).first().click();
  await expect(page).toHaveURL(/#progress$/);
});

test("daily plan preference survives a reload", async ({ page }) => {
  await page.goto("/#home");
  await page.getByRole("button", { name: "强化", exact: true }).click();
  await expect(page.locator('[data-plan-mode="intensive"]')).toHaveClass(/active/);
  await page.reload();
  await expect(page.locator('[data-plan-mode="intensive"]')).toHaveClass(/active/);
});

test("daily learning session can start", async ({ page }) => {
  await page.goto("/#home");
  await page.getByRole("button", { name: "开始今日计划" }).click();
  await expect(page).toHaveURL(/#study$/);
  await expect(page.locator(".study-shell")).toBeVisible();
});
