import { test as base } from "@playwright/test";
import { CatalogPage } from "../pages/catalog.page";
import { ForgotPasswordPage, LoginPage, SignupPage } from "../pages/auth.page";
import { DesignerProfilePage, DesignersPage } from "../pages/designers.page";
import { HomePage } from "../pages/home.page";
import { EnHomePage, EnLoginPage, EnPricingPage } from "../pages/locale.page";
import { NotFoundPage } from "../pages/not-found.page";
import { PricingPage } from "../pages/pricing.page";
import {
  ProfileLibraryPage,
  ProfileOverviewPage,
  ProfileSettingsPage,
  ProfileSidebarNav,
  ProfileUploadsPage,
} from "../pages/profile.page";

type AppFixtures = {
  catalogPage: CatalogPage;
  homePage: HomePage;
  pricingPage: PricingPage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  forgotPasswordPage: ForgotPasswordPage;
  designersPage: DesignersPage;
  designerProfilePage: DesignerProfilePage;
  notFoundPage: NotFoundPage;
  profileOverviewPage: ProfileOverviewPage;
  profileSettingsPage: ProfileSettingsPage;
  profileLibraryPage: ProfileLibraryPage;
  profileUploadsPage: ProfileUploadsPage;
  profileSidebarNav: ProfileSidebarNav;
  enHomePage: EnHomePage;
  enPricingPage: EnPricingPage;
  enLoginPage: EnLoginPage;
};

export const test = base.extend<AppFixtures>({
  catalogPage: async ({ page }, runFixture) => {
    await runFixture(new CatalogPage(page));
  },
  homePage: async ({ page }, runFixture) => {
    await runFixture(new HomePage(page));
  },
  pricingPage: async ({ page }, use) => {
    await use(new PricingPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },
  designersPage: async ({ page }, use) => {
    await use(new DesignersPage(page));
  },
  designerProfilePage: async ({ page }, use) => {
    await use(new DesignerProfilePage(page));
  },
  notFoundPage: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
  profileOverviewPage: async ({ page }, use) => {
    await use(new ProfileOverviewPage(page));
  },
  profileSettingsPage: async ({ page }, use) => {
    await use(new ProfileSettingsPage(page));
  },
  profileLibraryPage: async ({ page }, use) => {
    await use(new ProfileLibraryPage(page));
  },
  profileUploadsPage: async ({ page }, use) => {
    await use(new ProfileUploadsPage(page));
  },
  profileSidebarNav: async ({ page }, use) => {
    await use(new ProfileSidebarNav(page));
  },
  enHomePage: async ({ page }, use) => {
    await use(new EnHomePage(page));
  },
  enPricingPage: async ({ page }, use) => {
    await use(new EnPricingPage(page));
  },
  enLoginPage: async ({ page }, use) => {
    await use(new EnLoginPage(page));
  },
});

export { expect } from "@playwright/test";
