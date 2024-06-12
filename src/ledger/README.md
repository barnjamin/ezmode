Signer implementation for Ledger devices
----------------------------------------


If using WSL:

1) follow instructions here to expose the USB device https://learn.microsoft.com/en-us/windows/wsl/connect-usb
2) make sure you have kernel version > `5.15.150` with the CONFIG_HIDRAW kernel setting enabled
3) make sure the device is available by adding udev rules: https://github.com/LedgerHQ/udev-rules/blob/master/add_udev_rules.sh
4) enable blind signing in the apps you want to use (is this necessary?)
5) open the app for the chain (only 1 signer may be running at a given time so any examples that create multiple signers will fail)