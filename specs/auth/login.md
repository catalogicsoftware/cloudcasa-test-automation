# Login Test Plan

**Seed:** `seed.spec.ts`
**Login URL:** `https://ui.staging.cloudcasa.io/login`

---

## 1. Successful Login

### 1.1 Login with valid credentials

**Steps:**

1. Navigate to `/login`
2. Fill the "Enter your email" field with a valid email
3. Fill the "Enter your password" field with the correct password
4. Click the "Sign In" button

**Expected:**

- User is redirected to the dashboard (`/dashboard`)
- "Need some help?" popup appears
- Navigation bar is visible: Dashboard, Clusters, Databases, DR, Reports, Configuration
- User's name is shown in the top-right corner

---

## 2. Authentication Errors

### 2.1 Login with wrong password

**Steps:**

1. Navigate to `/login`
2. Fill "Enter your email" with a valid registered email
3. Fill "Enter your password" with an incorrect password (`WrongPassword999!`)
4. Click the "Sign In" button

**Expected:**

- User stays on the login page
- A pink error banner appears between the password field and the Sign In button: **"Wrong email or password."**
- Form fields retain their entered values

### 2.2 Login with non-existent email

**Steps:**

1. Navigate to `/login`
2. Fill "Enter your email" with `notexist@example.com`
3. Fill "Enter your password" with any value
4. Click the "Sign In" button

**Expected:**

- User stays on the login page
- Pink error banner: **"Wrong email or password."**
- No indication whether the email exists or not

---

## 3. Field Validation

### 3.1 Sign In button is disabled after submitting empty form

**Steps:**

1. Navigate to `/login`
2. Leave both fields empty
3. Click the "Sign In" button

**Expected:**

- The Sign In button becomes `disabled`
- No redirect occurs
- No error message is shown

### 3.2 Sign In button is disabled after submitting with email only

**Steps:**

1. Navigate to `/login`
2. Fill only the "Enter your email" field with any value
3. Leave "Enter your password" empty
4. Click the "Sign In" button

**Expected:**

- The Sign In button becomes `disabled`
- No redirect occurs

---

## 4. Forgot Password Flow

### 4.1 Forgot password form appears after clicking the button

**Steps:**

1. Navigate to `/login`
2. Click the "Forgot password" button (visible below the password field, right-aligned)

**Expected:**

- The password field disappears
- The Sign In button is replaced by a "Reset Password" button
- A "Go back to login form" link appears

### 4.2 Password reset email is sent for a valid email

**Steps:**

1. Navigate to `/login`
2. Click "Forgot password"
3. Fill the email field with a registered email
4. Click "Reset Password"

**Expected:**

- A green success banner appears: **"Password reset link has been sent to your email."**
- The form remains on the page (no redirect)

### 4.3 Go back to login form

**Steps:**

1. Navigate to `/login`
2. Click "Forgot password"
3. Click "Go back to login form"

**Expected:**

- Password field reappears
- "Sign In" button is restored
- "Forgot password" button is visible again
