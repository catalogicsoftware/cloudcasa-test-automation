// spec: specs/auth/auth.md (TC-AUTH-006)

import { test, expect } from '@fixtures/base';
import { fakeUser } from '@data/fake';
import { faker } from '@faker-js/faker';

test.describe('Sign-Up', () => {
  test('The sign-up form refuses bad data and then accepts good data', async ({
    signUpPage,
    page,
  }) => {
    // 1. Open the sign-up page and find out if the reCAPTCHA is active.
    await signUpPage.goto();
    const recaptchaActive = await signUpPage.isRecaptchaActive();

    // 2. If the reCAPTCHA stops the submit, mark the test with test.fixme(). Write one comment.
    // The reCAPTCHA on this environment is a live Google challenge, not a disabled test stub, so
    // the sign-up button never turns enabled in headless automation even once every field and
    // the consent checkbox hold valid values.
    test.fixme(
      recaptchaActive,
      'A live reCAPTCHA keeps the sign-up button disabled, so the submit steps cannot run.',
    );

    // 3. Make a user with fakeUser() from @data/fake.
    const user = fakeUser();

    // 4. Fill the e-mail field with a string without an at sign.
    await signUpPage.businessEmail.fill('not-an-email');

    // 5. Make sure that the form shows a field message and the submit stays off.
    await signUpPage.businessEmailMessage.shouldBeVisible();
    await signUpPage.signUpButton.shouldBeDisabled();

    // 6. Fill a good e-mail and a short password.
    await signUpPage.businessEmail.fill(user.email);
    await signUpPage.password.fill('short7', { secret: true });

    // 7. Make sure that the form shows the password rule and the submit stays off.
    await signUpPage.passwordMessage.shouldBeVisible();
    await signUpPage.signUpButton.shouldBeDisabled();

    // 8. Fill a good password. Keep the agreement checkboxes empty.
    await signUpPage.password.fill(user.password, { secret: true });
    await signUpPage.reEnterPassword.fill(user.password, { secret: true });
    await signUpPage.firstName.fill(user.firstName);
    await signUpPage.lastName.fill(user.lastName);
    await signUpPage.company.fill(faker.company.name());
    await signUpPage.jobTitle.fill(faker.person.jobTitle());

    // 9. Make sure that the submit stays off.
    await signUpPage.signUpButton.shouldBeDisabled();

    // 10. Select the agreement checkboxes.
    await signUpPage.consentCheckbox.check();

    // 11. Make sure that the submit is on.
    await signUpPage.signUpButton.shouldBeEnabled();

    // 12. Send the form.
    await signUpPage.signUpButton.click();

    // 13. Make sure that the application makes the account and shows the next page.
    await expect(page).not.toHaveURL(/signup\.cloudcasa\.io\/?$/);
    await expect(signUpPage.businessEmail.getLocator()).toBeHidden();
  });
});
