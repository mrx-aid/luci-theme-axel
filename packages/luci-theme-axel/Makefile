include $(TOPDIR)/rules.mk
PKG_VERSION:=0.2.0
PKG_RELEASE:=1
LUCI_TITLE:=AXEL Mesh theme with light and dark modes
LUCI_DEPENDS:=+luci-theme-axel-core
LUCI_PKGARCH:=all
define Package/luci-theme-axel/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	[ "$$(uci -q get luci.main.mediaurlbase)" != /luci-static/axel ] || uci set luci.main.mediaurlbase=/luci-static/bootstrap
	uci -q delete luci.themes.AXELMesh
	uci commit luci
}
exit 0
endef
include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature (implementation is in luci.mk)
