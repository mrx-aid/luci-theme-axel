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
./scripts/feeds install -p luci luci-theme-axel-core luci-theme-atlas luci-theme-axel
printf '%s\n' 'CONFIG_PACKAGE_luci-theme-axel-core=m' 'CONFIG_PACKAGE_luci-theme-atlas=m' 'CONFIG_PACKAGE_luci-theme-axel=m' 'CONFIG_ALL_NONSHARED=n' 'CONFIG_ALL_KMODS=n' 'CONFIG_ALL=n' 'CONFIG_LUCI_JSMIN=n' 'CONFIG_LUCI_CSSTIDY=n' 'CONFIG_LUCI_UTMIN=n' >> .config
make defconfig
for name in luci-theme-axel-core luci-theme-atlas luci-theme-axel; do
  make -j2 "package/feeds/luci/$name/compile" V=s
done
mkdir -p "$artifact_dir"
find bin/packages -type f \( -name 'luci-theme-axel-*.apk' -o -name 'luci-theme-atlas-*.apk' \) -exec cp '{}' "$artifact_dir/" \;
test "$(find "$artifact_dir" -maxdepth 1 -name '*.apk' | wc -l)" -eq 3
cd "$artifact_dir"
sha256sum ./*.apk > SHA256SUMS
