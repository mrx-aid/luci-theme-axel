include $(TOPDIR)/rules.mk
PKG_VERSION:=0.2.0
PKG_RELEASE:=3
LUCI_MAINTAINER:=Alexandr Azimov
LUCI_URL:=https://github.com/mrx-aid/luci-theme-axel
LUCI_TITLE:=ATLAS Heritage theme with light and dark modes
LUCI_DEPENDS:=+luci-theme-axel-core
LUCI_PKGARCH:=all
define Package/luci-theme-atlas/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	[ "$$(uci -q get luci.main.mediaurlbase)" != /luci-static/atlas ] || uci set luci.main.mediaurlbase=/luci-static/bootstrap
	uci -q delete luci.themes.ATLAS
	uci commit luci
}
exit 0
endef
include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature (implementation is in luci.mk)
