import { test, expect } from "@playwright/test";

test("Google Sign-In", async ({ page }) => {
  const base_url = /https:\/\/accounts\.google\.com\/v3\/signin/;
  const access_type = /access_type=offline/;
  const redirect_uri =
    /redirect_uri=http%3A%2F%2Flocalhost.com%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle/;
  const scope = /scope=openid\+email\+profile/;

  await page.goto("/");
  await page.getByText(/sign in/i).click();

  // Verify the sign-in page loads correctly
  
  await page.getByText("Sign in with Google").click();  

  await expect(page).toHaveURL(base_url);
  await expect(page).toHaveURL(access_type);
  await expect(page).toHaveURL(redirect_uri);
  await expect(page).toHaveURL(scope);
});


test("Twitter Sign-In", async ({ page }) => {
  // TODO: Fix issue with redirects and finish test.
  const base_url = /https:\/\/x.com\/i\/oauth2/;
  const scope = /scope=users.read\+tweet.read\+offline.access/;
  const redirect_uri = /redirect_uri%3Dhttp%253A%252F%252Flocalhost.com%253A3000%252Fapi%252Fauth%252Fcallback%252Ftwitter/;
  const response_type = /response_type%3Dcode/;

  await page.goto("/");
  
  await page.getByText(/sign in/i).click();

  // Verify the sign-in page loads correctly
  await expect(
    page.getByRole("button", { name: /sign in with twitter/i })
  ).toBeEnabled();

  await Promise.all([
    page.getByRole("button", { name: /sign in with twitter/i }).click(),
    page.waitForURL(/https:\/\/x\.com\/i\/oauth2\/authorize/), // wait for external redirect
  ]);

  const currentURL = new URL(page.url());
  expect(currentURL.hostname).toBe("x.com");
});

test("Session Expired Error Display", async ({ page }) => {
  // Navigate to sign-in page with session_expired error
  await page.goto("/signin?error=session_expired");

  // Verify the error message is displayed
  await expect(page.locator('div.bg-red-50')).toBeVisible();
  await expect(page.getByText('Your session has expired. Please sign in again to continue.')).toBeVisible();
  
  // Verify sign-in options are still available
  await expect(page.getByText('Sign in with Google')).toBeVisible();
  await expect(page.getByText('Sign in with Twitter')).toBeVisible();
});
