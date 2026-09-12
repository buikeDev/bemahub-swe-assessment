# Task 6 — Infrastructure

## Incident 1 — the invisible deploy

1. Compare the exact URL, environment, account, and reproduction steps with the colleague. Check feature flags and account permissions if the feature is conditional. This cheaply distinguishes a different environment or rollout cohort from a deployment failure.
2. Inspect the affected browser's Network requests: which API host and JavaScript assets were requested, and were responses served from browser cache or a service worker? Try a private window or reload with cache disabled. If that fixes it, investigate browser caching or service-worker updates; it does not yet prove all users received the new build.
3. Trace the intended commit through the build artifact and deployment to the running application. Compare commit/build identifiers and container image digests where available, rather than trusting a mutable tag such as latest. A successful build can package the wrong branch, or a successful deployment can still reference an older image.
4. If the running release is correct, compare the public response with the origin response through an authorized diagnostic path. Inspect Cache-Control, Age, ETag, and provider-specific cache headers. Fresh origin content but old public content points to CDN or reverse-proxy caching; invalidate the affected objects only after establishing that cause.
5. Check every replica's release identifier and repeat requests if results vary. Mixed releases or a partial rollout can explain why the colleague sees the change. If all replicas match, return to runtime flags and environment configuration, including frontend values embedded at build time.

Verification: repeat the original user's steps and confirm the intended build is serving the expected behavior across replicas and a fresh browser session. A green deployment status alone is not proof.

## Incident 2 — 502 after deploy

1. Capture one failing request, timestamp, and request ID if available, then read the gateway's error log. Identify the upstream and whether it reports connection refused, name resolution failure, timeout, or an invalid upstream response. This locates the failed connection instead of assuming the browser or application generated the 502.
2. Check application startup logs, health/readiness, restart count, and the process listening on the expected port. A container can be running while its application is crashed, restarting, bound only to localhost, or never ready. A startup exception mentioning the new configuration value makes the deployment change the leading suspect.
3. Compare the required configuration name, presence, format, and injection source against the last working release. Check spelling/case, deployment environment, secret/config mapping, and whether it must be supplied at build time or runtime. Validate presence and parsing without printing secret values. A missing or malformed value can prevent startup; a value available locally may never have reached the deployed container.
4. Probe the health/API endpoint from inside the application container and from the gateway's network. If it works locally but not from the gateway, inspect the bind address, target port, service DNS, and network policy. If the new value is an upstream URL, check that hostname and port from inside the container; localhost refers to that container, not a separate service. A wrong endpoint or unreachable dependency may produce timeouts even while the application process is alive.
5. For an active outage, preserve the relevant logs and roll back to the last known working release/configuration if a fix cannot be made promptly. Recovery after rollback supports a release/config regression, but does not identify the precise cause by itself. Correct the configuration or code, validate required values at startup with clear errors, and make readiness reflect whether the service can accept requests.

Verification: check the same public API request through the gateway, application readiness, and absence of fresh upstream errors. Test the actual new-feature path as well as a health endpoint.

## Incident 3 — the vanishing change

The colleague installed the tool into the running container's writable filesystem layer. That changes that particular container, not the image used to create it. A deployment that replaces the container starts from the image again, so the manually installed tool disappears. Restarting the same container is different from replacing it; the latter loses this writable layer.

First compare the old/new container identity, image digest, and deployment definition to confirm replacement. If the file was expected to live on a volume, inspect the mount and path: a changed or missing mount can also make files appear to vanish.

If the application actually needs the tool, add its installation and configuration to the Dockerfile/build process, use a suitable pinned version, commit the change, build and test a new image in CI, and deploy that image. Keep runtime configuration in the deployment configuration and persistent application data on an appropriate volume or external store. A volume is not a substitute for recording installed application dependencies in the image.

If the tool was only for diagnosis, use a separate debug image or an ephemeral debug container instead of making the application depend on a manual installation. Verify the permanent fix by creating a fresh container from the rebuilt image and reproducing the behavior; checking the manually modified container would miss the original problem.

---

AI assistance: these are assistant-drafted diagnostic approaches for the supplied scenarios. No incident commands were executed, as the task requires written answers only. Candidate review and explanation of the reasoning remain required before submission.
