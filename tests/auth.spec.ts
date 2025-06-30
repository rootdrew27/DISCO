import { test, expect } from "@playwright/test";
import { describe } from "node:test";

test("Google Sign-In", async ({ page }) => {
  const base_url = /https:\/\/accounts\.google\.com\/v3\/signin/;
  const access_type = /access_type=offline/;
  const redirect_uri =
    /redirect_uri=http%3A%2F%2Fwww.localhost.com%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle/;
  const scope = /scope=openid\+email\+profile/;

  await page.goto("/");

  await page.getByText("Sign in with Google").click();

  await expect(page).toHaveURL(base_url);
  await expect(page).toHaveURL(access_type);
  await expect(page).toHaveURL(redirect_uri);
  await expect(page).toHaveURL(scope);
});

test("Twitter Sign-In", async ({ page }) => {
  const base_url = /https:\/\/x.com\/i\/oauth2/;
  const scope = /scope%3Dusers.read%2Btweet.read%2Boffline.access/;
  const redirect_uri =
    /redirect_uri%3Dhttp%253A%252F%252Fwww.localhost.com%253A3000%252Fapi%252Fauth%252Fcallback%252Ftwitter/;
  const response_type = /response_type%3Dcode/;

  await page.goto("/");

  await page.getByText("Sign in with X").click();

  await expect(page).toHaveURL(base_url);
  await expect(page).toHaveURL(scope);
  await expect(page).toHaveURL(redirect_uri);
  await expect(page).toHaveURL(response_type);
});
