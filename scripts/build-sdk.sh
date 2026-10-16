#!/usr/bin/env bash
set -euo pipefail
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
artifact_dir="$source_dir/dist"
sdk_work=$(mktemp -d)
sdk_name=openwrt-sdk-25.12.5-mediatek-filogic_gcc-14.3.0_musl.Linux-x86_64
sdk_hash=ff4a38a397caa2cfe1c39e18f84ddede14878221b3593c3f2c4cfe24e3ec4c25
cd "$sdk_work"
curl --fail --location --retry 3 --connect-timeout 20 --max-time 600 \
  "https://downloads.openwrt.org/releases/25.12.5/targets/mediatek/filogic/$sdk_name.tar.zst" -o sdk.tar.zst
printf '%s  sdk.tar.zst\n' "$sdk_hash" | sha256sum --check --strict
tar --zstd -xf sdk.tar.zst
cd "$sdk_name"
./scripts/feeds update -a
for name in luci-theme-axel-core luci-theme-atlas luci-theme-axel; do
  mkdir -p "feeds/luci/themes/$name"
  cp -a "$source_dir/packages/$name/." "feeds/luci/themes/$name/"
done
./scripts/feeds update -i luci
for name in luci-theme-axel-core luci-theme-atlas luci-theme-axel; do
  grep -q "^Package: $name\$" feeds/luci.index
done
./scripts/feeds install -p luci luci-theme-axel-core luci-theme-atlas luci-theme-axel
printf '%s\n' 'CONFIG_PACKAGE_luci-theme-axel-core=m' 'CONFIG_PACKAGE_luci-theme-atlas=m' 'CONFIG_PACKAGE_luci-theme-axel=m' 'CONFIG_ALL_NONSHARED=n' 'CONFIG_ALL_KMODS=n' 'CONFIG_ALL=n' 'CONFIG_LUCI_JSMIN=n' 'CONFIG_LUCI_CSSTIDY=n' 'CONFIG_LUCI_UTMIN=n' >> .config
make defconfig
for name in luci-theme-axel-core luci-theme-atlas luci-theme-axel; do
  make -j2 "package/feeds/luci/$name/compile" V=s
done
mkdir -p "$artifact_dir"
find bin/packages -type f \( -name 'luci-theme-axel-*.apk' -o -name 'luci-theme-atlas-*.apk' \) -exec cp '{}' "$artifact_dir/" \;
test "$(find "$artifact_dir" -maxdepth 1 -name '*.apk' | wc -l)" -eq 3
audit_dir=$(mktemp -d)
for package in "$artifact_dir"/*.apk; do
  staging_dir/host/bin/apk --allow-untrusted extract --destination "$audit_dir" "$package"
  staging_dir/host/bin/apk adbdump "$package" > "$artifact_dir/$(basename "$package").manifest.txt"
done
# Compile the installed template sources with the release's native ucode compiler.
# Dynamic luci.core import is resolved only on the router; no template is executed here.
./scripts/feeds install -p base ucode
make -j2 package/feeds/base/ucode/host/compile V=s
ucode_bin=$(find staging_dir/host staging_dir/hostpkg -path '*/bin/ucode' -type f -print -quit)
test -n "$ucode_bin"
while IFS= read -r template; do
  "$ucode_bin" -T -cdynlink=luci.core -o "$sdk_work/template-check.uc" "$template"
done < <(find "$audit_dir/usr/share/ucode/luci/template/themes" -type f -name '*.ut')
cmp "$source_dir/packages/luci-theme-axel-core/htdocs/luci-static/axel-core/theme.css" "$audit_dir/www/luci-static/axel-core/theme.css"
for name in atlas axel; do
  test -f "$audit_dir/etc/uci-defaults/90_luci-theme-$name"
done
test ! -e "$audit_dir/etc/config/network"
test ! -e "$audit_dir/etc/config/firewall"
printf '%s\n' 'PASS: three APKs extracted without installation; ucode templates compiled; installed CSS matches source; no network/firewall configuration shipped.' > "$artifact_dir/package-audit.txt"
cd "$artifact_dir"
sha256sum ./*.apk > SHA256SUMS
