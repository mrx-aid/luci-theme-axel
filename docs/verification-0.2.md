# Verification: development 0.2

## Local browser checks (2026-10-17)

The test page loads the package CSS and JavaScript, the original ATLAS logo/avatar, and the actual VPN-Tunneling view. LuCI rendering and RPC are imitated locally. This is not evidence of a working router installation or VPN connection.

- ATLAS and AXEL Mesh: checked at 320 px; the page has no horizontal document overflow.
- Profile menu stays within the viewport, closes with Escape, and returns focus to its summary.
- Light/Dark changes the displayed palette and survives reload.
- Mobile navigation opens and switches the two theme previews.
- The profile form fits a 320 × 740 viewport with internal scrolling. Fixed the inherited Bootstrap margin that previously pushed the bottom outside the viewport.
- Adding a synthetic WireGuard profile and confirming the handshake-only probe works against the mock service. The mock never reports a successful handshake.
- No browser console errors or warnings were recorded during these checks.
- Package source checks cover LuCI hooks, warnings, original asset hashes, JavaScript syntax, SDK package discovery, and absence of router mutations in theme scripts.

## SDK package verification (2026-10-17)

Build [38982040122](https://github.com/mrx-aid/luci-theme-axel/actions/runs/38982040122), source commit `3bbc11dd8293a09a562bc519bd10da31feab2fb1`, completed successfully for OpenWrt 25.12.5 mediatek/filogic. It produced `luci-theme-axel-core`, `luci-theme-atlas`, and `luci-theme-axel` version `0.2.0-r3`.

All three APKs were extracted without installation; their manifests and installed CSS were checked. All six ucode templates compiled with the SDK's native compiler. The downloaded artifact digest and each APK's SHA-256 were verified locally. No router configuration was changed by these checks. See the build artifact's `package-audit.txt`, manifests, and `SHA256SUMS`.

## Still required on a test router

Actual ucode rendering, login/session expiry, complete native navigation, Save & Apply/rollback, third-party applications, theme selection/removal, and hardware screenshots. Keep Bootstrap installed and an SSH fallback available. Do not represent local preview screenshots as finished router functionality.
