# Deployment Report — Marketing Website (Milestone 1)

Project: Example Grant Site
Production URL: https://example-grant-site.io
Deployment date: 2026-10-14
Deployed by: Builder team

## What was deployed

The marketing website was deployed to production hosting (static build,
CDN-backed). The release includes the three pages required by the milestone:

- Homepage (`/`) — hero section, feature overview, grant program summary.
- About page (`/about`) — team, mission, and roadmap sections.
- Contact page (`/contact`) — working contact form (name, email, message)
  with server-side validation and a confirmation state after submit.

## Verification checks performed after deployment

- Homepage returns HTTP 200 and renders the hero section.
- About page returns HTTP 200 with all sections present.
- Contact form submitted a test message end to end; the message was
  received by the site inbox and the confirmation state displayed.
- DNS for example-grant-site.io resolves to the production host.
- TLS certificate is active; the site is served over HTTPS with HTTP
  redirected to HTTPS.
- Pages checked on mobile and desktop viewports; no layout breakage.

## Result

All pages required by the milestone spec are live in production and were
verified working on the deployment date above.
