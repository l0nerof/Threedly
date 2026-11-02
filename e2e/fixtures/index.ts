import { test as base, expect } from "@playwright/test";
import {
  ForgotPasswordPage,
  LoginPage,
  ResetPasswordPage,
  SignupPage,
  VerifyEmailPage,
} from "../pages/auth.page";
import { CatalogPage } from "../pages/catalog.page";
import { DesignerProfilePage, DesignersPage } from "../pages/designers.page";
import { HomePage } from "../pages/home.page";
import { EnHomePage, EnLoginPage, EnPricingPage } from "../pages/locale.page";
import { MarketplaceAccessPage } from "../pages/marketplace-access.page";
import { NotFoundPage } from "../pages/not-found.page";
import { PricingPage } from "../pages/pricing.page";
import {
  ProfileLibraryPage,
  ProfileOverviewPage,
  ProfileSettingsPage,
  ProfileSidebarNav,
  ProfileUploadsPage,
} from "../pages/profile.page";
import { PublicationRecoveryPage } from "../pages/publication-recovery.page";
import { PublicationPage } from "../pages/publication.page";
import { type LocalEmailAuth, createLocalEmailAuth } from "./local-email-auth";
import {
  type LocalMarketplace,
  createLocalMarketplace,
} from "./local-marketplace";
import { localMutationTestsEnabled } from "./model-publication";
import {
  type PublicationNetworkControls,
  createPublicationNetworkControls,
} from "./publication-recovery";

type AppFixtures = {
  catalogPage: CatalogPage;
  homePage: HomePage;
  pricingPage: PricingPage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  forgotPasswordPage: ForgotPasswordPage;
  verifyEmailPage: VerifyEmailPage;
  resetPasswordPage: ResetPasswordPage;
  localEmailAuth: LocalEmailAuth;
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
  publicationPage: PublicationPage;
  marketplaceAccessPage: MarketplaceAccessPage;
  localMarketplace: LocalMarketplace;
  publicationRecoveryPage: PublicationRecoveryPage;
  publicationNetwork: PublicationNetworkControls;
};

export const test = base.extend<AppFixtures>({
  localEmailAuth: [
    async ({}, use) => {
      base.skip(
        !localMutationTestsEnabled,
        "Email tests require the isolated local Supabase stack",
      );
      const fixture = await createLocalEmailAuth();
      try {
        await use(fixture);
      } finally {
        await fixture.dispose();
      }
    },
    { timeout: 90_000 },
  ],
  verifyEmailPage: async ({ page }, use) => {
    await use(new VerifyEmailPage(page));
  },
  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page));
  },
  publicationRecoveryPage: async ({ page }, use) => {
    await use(new PublicationRecoveryPage(page));
  },
  publicationNetwork: async ({ page, browserName }, use) => {
    base.skip(
      browserName !== "chromium",
      "Native network blocking uses Chromium DevTools",
    );
    const controls = await createPublicationNetworkControls(page);
    try {
      await use(controls);
    } finally {
      await controls.dispose();
    }
  },
  marketplaceAccessPage: async ({ page }, use) => {
    await use(new MarketplaceAccessPage(page));
  },
  localMarketplace: [
    async ({}, use) => {
      base.skip(
        !localMutationTestsEnabled,
        "Isolated local marketplace tests require THREEDLY_E2E_LOCAL_MUTATIONS=1",
      );
      const marketplace = await createLocalMarketplace();
      try {
        await use(marketplace);
      } finally {
        await marketplace.dispose();
      }
    },
    { timeout: 90_000 },
  ],
  publicationPage: async ({ page }, use) => {
    await use(new PublicationPage(page));
  },
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

export { expect };
