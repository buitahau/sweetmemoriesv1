# Open questions: google-sign-in and dashboard-home features

Specs: [google-sign-in](../features/google-sign-in.md), [dashboard-home](../features/dashboard-home.md)

## Topic: google-sign-in

### Q-route: The requirement says 'Login page', but the homepage links and copy say 'Sign in'. Which path should the page use?

Options:
- Keep /sign-in
- Rename to /login (and update homepage links)
- Serve both, /login redirecting to /sign-in

Recommended answer: Keep /sign-in: it matches the existing links, tests and the mockup's wording, so nothing else has to change.

Answer:

### Q-copy-search: The mockup promises 'You can hide any page from search engines.' No such feature exists. What should the page show?

Options:
- Drop that promise (show two promises)
- Keep it and add a hide-from-search feature to the backlog
- Replace it with another true promise, for example 'Memories are public pages you choose to publish.'

Recommended answer: Drop it until the feature exists: the page should not promise something the product cannot do.

Answer:

### Q-copy-address: The mockup says 'Then you pick your address, like sam.sweetmemories.com', but the requirement sends the User straight to the dashboard and subdomain choice is not built. What should it say?

Options:
- Keep only 'The same button makes your account.'
- Keep the full sentence (subdomain choice is coming next)
- Reword to 'You will choose your address, like sam.sweetmemories.com, later.'

Recommended answer: Keep only 'The same button makes your account.' until the subdomain feature defines when the User picks an address.

Answer:

### Q-legal: The footer links to Terms and Privacy policy, but neither page exists. What should happen?

Options:
- Hide the 'By continuing you agree...' line until the pages exist
- Show the line as plain text without links
- Create placeholder Terms and Privacy pages in this feature

Recommended answer: Hide the line until real pages exist: dead '#' links are misleading. Note that publishing the Google consent screen will need a privacy policy URL.

Answer:

### Q-consent: Who can sign in on dev? This sets the Google OAuth consent screen mode.

Options:
- Testing mode: only Google accounts listed as test users
- In production: any Google account

Recommended answer: Testing mode for dev: it needs no Google verification or privacy policy, and it keeps dev limited to known testers.

Answer:

### Q-error-copy: Please confirm the error copy on the Login page.

Options:
- Cancel: 'Sign-in was cancelled. You can try again.' / Other: 'Something went wrong signing you in. Please try again.'
- Provide different copy

Recommended answer: Use the proposed two fixed messages: they are short, friendly and never echo the URL.

Answer:

## Topic: dashboard-home

### Q-dashboard: No dashboard mockup exists. What should /dashboard show in this feature?

Options:
- Minimal: 'Hi, <first name>' heading plus a Sign out button
- Minimal plus the Google profile photo and an empty 'No Memories yet' state
- Wait for a dashboard mockup before building the page

Recommended answer: Minimal greeting plus Sign out: it meets 'go to dashboard home page' without inventing Memory UI before the design exists.

Answer:

### Q-signout: Is sign-out in scope, and where should it land?

Options:
- Yes, land on / (homepage)
- Yes, land on /sign-in
- Not in scope

Recommended answer: Yes, land on /: testers need to switch accounts, and the homepage is the natural signed-out start.

Answer:
