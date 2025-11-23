import { pool } from "./connect.js";

export async function ensureFlipperSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flipper_categories (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      parent_id INTEGER REFERENCES flipper_categories(id) ON DELETE SET NULL,
      position INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flipper_firmwares (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      short_description TEXT,
      description_raw TEXT,
      description_rendered TEXT,
      homepage_url TEXT,
      repo_url TEXT,
      is_custom BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flipper_articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id INTEGER REFERENCES flipper_categories(id) ON DELETE SET NULL,
      firmware_id INTEGER REFERENCES flipper_firmwares(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      summary TEXT,
      content_raw TEXT,
      content_rendered TEXT,
      tags JSONB DEFAULT '[]'::jsonb,
      complexity_level TEXT,
      estimated_duration_min INTEGER,
      status TEXT DEFAULT 'draft',
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flipper_modules (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      short_description TEXT,
      description_raw TEXT,
      description_rendered TEXT,
      firmware_id INTEGER REFERENCES flipper_firmwares(id) ON DELETE SET NULL,
      supported_firmwares JSONB DEFAULT '[]'::jsonb,
      category_id INTEGER REFERENCES flipper_categories(id) ON DELETE SET NULL,
      source_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flipper_article_queue (
      id SERIAL PRIMARY KEY,
      article_id INTEGER REFERENCES flipper_articles(id) ON DELETE SET NULL,
      operation TEXT NOT NULL,
      payload JSONB DEFAULT '{}'::jsonb,
      source TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      locked_at TIMESTAMPTZ,
      processed_at TIMESTAMPTZ,
      created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_categories_type ON flipper_categories(type);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_categories_parent ON flipper_categories(parent_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_categories_active ON flipper_categories(is_active);`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_firmwares_active ON flipper_firmwares(is_active);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_firmwares_slug ON flipper_firmwares(slug);`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_articles_category ON flipper_articles(category_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_articles_firmware ON flipper_articles(firmware_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_articles_status ON flipper_articles(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_articles_type ON flipper_articles(type);`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_modules_firmware ON flipper_modules(firmware_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_modules_category ON flipper_modules(category_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_modules_active ON flipper_modules(is_active);`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_article_queue_status ON flipper_article_queue(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_article_queue_locked_at ON flipper_article_queue(locked_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_flipper_article_queue_created_by ON flipper_article_queue(created_by_id);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'flipper_categories_set_updated_at') THEN
        CREATE TRIGGER flipper_categories_set_updated_at
        BEFORE UPDATE ON flipper_categories
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'flipper_firmwares_set_updated_at') THEN
        CREATE TRIGGER flipper_firmwares_set_updated_at
        BEFORE UPDATE ON flipper_firmwares
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'flipper_articles_set_updated_at') THEN
        CREATE TRIGGER flipper_articles_set_updated_at
        BEFORE UPDATE ON flipper_articles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'flipper_modules_set_updated_at') THEN
        CREATE TRIGGER flipper_modules_set_updated_at
        BEFORE UPDATE ON flipper_modules
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'flipper_article_queue_set_updated_at') THEN
        CREATE TRIGGER flipper_article_queue_set_updated_at
        BEFORE UPDATE ON flipper_article_queue
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);

  await seedFlipperData();
}

async function seedFlipperData() {
  await pool.query(`
    INSERT INTO flipper_categories (slug, title, description, type, position)
    VALUES
      ('rfid_nfc', 'RFID / NFC', 'Базовые операции с RFID/NFC', 'basic', 1),
      ('subghz', 'Sub-GHz', 'Беспроводные сигналы 300-928 MHz', 'basic', 2),
      ('infrared', 'Infrared (IR)', 'Управление инфракрасными устройствами', 'basic', 3),
      ('ibutton', 'iButton', 'Ключи iButton и эмуляция', 'basic', 4),
      ('bluetooth_ble', 'Bluetooth / BLE', 'BLE сканирование и сервисы', 'basic', 5),
      ('badusb', 'BadUSB', 'Payloads и сценарии BadUSB', 'basic', 6),
      ('gpio_uart', 'GPIO / UART / Hardware', 'Подключение датчиков и отладка', 'basic', 7),
      ('filesystem', 'Файловая система', 'Дерево файлов Flipper', 'basic', 8),
      ('unleashed', 'Unleashed', 'Кастомная прошивка Unleashed', 'firmware', 10),
      ('marauder', 'Marauder (Wi-Fi Board)', 'Marauder toolkit', 'firmware', 11),
      ('momentum', 'Momentum', 'Momentum firmware', 'firmware', 12),
      ('bunnyloader', 'BunnyLoader / BadUSB', 'BunnyLoader payloads', 'firmware', 13),
      ('guides_general', 'Основные гайды', 'Сценарии и инструкции', 'guide', 20),
      ('vulns_general', 'Известные уязвимости', 'Каталог уязвимостей', 'vuln', 21)
    ON CONFLICT (slug) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO flipper_firmwares (slug, name, short_description, is_custom, is_active)
    VALUES
      ('unleashed', 'Unleashed', 'Базовое описание кастомной прошивки', TRUE, TRUE),
      ('marauder', 'Marauder (Wi-Fi Board)', 'Тестовое описание', TRUE, TRUE),
      ('momentum', 'Momentum', 'Тестовое описание', TRUE, TRUE),
      ('bunnyloader', 'BunnyLoader / BadUSB', 'Тестовое описание', TRUE, TRUE)
    ON CONFLICT (slug) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO flipper_modules (slug, name, short_description, firmware_id, category_id, is_active)
    VALUES (
      'subghz_scanner',
      'Sub-GHz Scanner',
      'Базовое тестовое описание',
      (SELECT id FROM flipper_firmwares WHERE slug = 'unleashed'),
      (SELECT id FROM flipper_categories WHERE slug = 'subghz'),
      TRUE
    )
    ON CONFLICT (slug) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO flipper_articles (slug, title, type, category_id, firmware_id, status)
    VALUES
      ('rfid-test-intro', 'Введение в RFID', 'feature_basic', (SELECT id FROM flipper_categories WHERE slug = 'rfid_nfc'), NULL, 'published'),
      ('subghz-test-intro', 'Основы Sub-GHz', 'feature_basic', (SELECT id FROM flipper_categories WHERE slug = 'subghz'), NULL, 'published'),
      ('unleashed-main-overview', 'Unleashed — обзор возможностей', 'feature_custom_fw', (SELECT id FROM flipper_categories WHERE slug = 'unleashed'), (SELECT id FROM flipper_firmwares WHERE slug = 'unleashed'), 'published'),
      ('marauder-test-overview', 'Marauder — обзор возможностей', 'feature_custom_fw', (SELECT id FROM flipper_categories WHERE slug = 'marauder'), (SELECT id FROM flipper_firmwares WHERE slug = 'marauder'), 'published'),
      ('guide-ble-locks', 'Как проверить BLE-замок', 'guide_scenario', (SELECT id FROM flipper_categories WHERE slug = 'guides_general'), NULL, 'published'),
      ('vuln-fixed-code-subghz', 'Sub-GHz: фиксированный код', 'vuln_check', (SELECT id FROM flipper_categories WHERE slug = 'vulns_general'), NULL, 'published')
    ON CONFLICT (slug) DO NOTHING;
  `);
}
