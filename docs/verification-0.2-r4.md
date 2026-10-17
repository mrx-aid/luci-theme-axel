# ATLAS Heritage integration update (core 0.2.0-r4)

Status: source checks and local native-class fixture; device validation pending. This is not a claim that the deployed router has been updated.

## What changed

- ATLAS shell follows the approved Heritage hierarchy: two-level black header, original logo/avatar, angular banner, module sidebar/device card, compact overview.
- Native LuCI pages and their save/apply controls remain intact. The standard overview is preserved at its original route; Network Control is a new read-only page.
- Theme preferences are stored per browser and per theme. They do not alter UCI, firewall, network or VPN configuration.
- Header alignment: full width, aligned to content, or a validated custom 960–2400 px inner width. The background remains full width. Small screens use a responsive layout.
- Technical ticker: selectable host, model, firmware, uptime, load, RAM, root storage and WAN; slash separators; independent information/healthy/warning colours. Unknown or failed samples are neutral, never reused as green.
- RAM and storage thresholds default to 90%. Load is an absolute 1-minute load average, not a CPU percentage, and stays informational unless the user sets a nonzero threshold. WAN green means interface up, not an internet reachability probe.
- Ticker uses a shared 10-second read-only LuCI poll, skips hidden tabs and does not make external requests. A paused ticker still updates values. Reduced-motion disables scrolling animation.
- Narrow-screen navigation, native tabs/labels, compound Save & Apply, button contrast, logo hover, progress labels and dropdown positioning are covered by regression fixtures.

## Data sources / limitations

Only `system.board`, `system.info`, `network.interface.dump`, and `luci-rpc.getWirelessDevices` are declared in a read-only ACL. No exec/file write privileges. No new backend service, internet ping, packet capture or traffic routing. Wireless KPI counts radios, not connected clients. RAM uses MemAvailable or free+buffered+cached fallback; untrustworthy inputs show unavailable. Storage uses the root totals from system.info (KiB), not every attached mount.

The view polls only while open. All protocol configuration and live VPN work remain outside this update. Theme settings are not yet shared between browsers or users.

## Tests

`node scripts/check-preferences.mjs`, `node scripts/check-telemetry.mjs`, `node scripts/check-packages.mjs`, plus the existing prototype checks. `node scripts/preview-native.mjs` serves a loopback-only fixture with actual packaged modules and explicit mock RPC; it cannot reach a router. Its normal/warning/unavailable scenarios are not production telemetry.

The SDK job must compile the ucode templates and audit the APK before installation. After installing the core update, reload LuCI without cache; re-login if the new read-only menu ACL is not reflected in the existing session. Keep Bootstrap and SSH available for rollback.
