name: Flipper Zero — тестовые данные
description: Набор стартовых данных для проверки раздела Flipper Zero (категории, прошивки, модули, статьи).

# Flipper Zero — тестовые записи (seed)

Загружается при старте `ensureFlipperSchema`:

- Категории (flipper_categories):
  - basic: `rfid_nfc`, `subghz`, `infrared`, `ibutton`, `bluetooth_ble`, `badusb`, `gpio_uart`, `filesystem`
  - firmware: `unleashed`, `marauder`, `momentum`, `bunnyloader`
  - guide: `guides_general`
  - vuln: `vulns_general`
- Прошивки (flipper_firmwares): `unleashed`, `marauder`, `momentum`, `bunnyloader`.
- Модуль: `subghz_scanner` (категория `subghz`, прошивка `unleashed`).
- Статьи (published):
  - `rfid-test-intro` (feature_basic, rfid_nfc)
  - `subghz-test-intro` (feature_basic, subghz)
  - `unleashed-main-overview` (feature_custom_fw, прошивка unleashed)
  - `marauder-test-overview` (feature_custom_fw, прошивка marauder)
  - `guide-ble-locks` (guide_scenario, guides_general)
  - `vuln-fixed-code-subghz` (vuln_check, vulns_general)
