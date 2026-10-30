# Matomo tracker fixture

Unmodified Matomo 5.5.0 JavaScript tracker, used only by the consent tests so a live
analytics outage cannot block application builds. Tracking requests are fulfilled
locally too; the tests do not send analytics to the production service.

Source: https://github.com/matomo-org/matomo/blob/5.5.0/matomo.js

SHA-256: `1762dd6a64fcd59421610b68625258f9224a1f278159c4d99282adb631470465`

License: BSD-3-Clause (see `LICENSE.txt`). Refresh this fixture when upgrading the
deployed Matomo tracker; live service availability must be monitored separately.
