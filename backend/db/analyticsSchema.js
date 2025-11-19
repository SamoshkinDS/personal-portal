import { pool } from "./connect.js";

function slugify(title) {
  const base = String(title || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яёіїєґ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base) return base.slice(0, 120);
  return `topic-${Date.now()}`;
}

function safeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

async function seedTopicsAndArticles() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM topics");
  if ((rows?.[0]?.count || 0) > 0) return;

  const catalog = [
    {
      title: "Моделирование процессов",
      description: "Базовые нотации, практики и артефакты процессного моделирования.",
      tags: ["bpmn", "uml", "erd"],
      children: [
        {
          title: "BPMN",
          description: "Диаграммы и паттерны BPMN 2.0, применение в продуктах.",
          tags: ["bpmn"],
          articles: [
            {
              title: "Диаграммы BPMN: ключевые элементы",
              summary: "Минимальный набор элементов BPMN для командной документации.",
              content:
                "<p>BPMN 2.0 описывает процессы через диаграммы с событиями, задачами, шлюзами и потоками.</p><p>Для быстрых стартов используйте: start/end event, user/service task, exclusive gateway, intermediate message event. Придерживайтесь единых цветов и подписей, чтобы диаграммы были читаемы.</p>",
              tags: ["bpmn", "process"],
            },
          ],
        },
        {
          title: "UML",
          description: "Use Case, Activity и Sequence диаграммы для сервисов.",
          tags: ["uml"],
        },
        {
          title: "ERD",
          description: "Диаграммы данных, связи таблиц и принципы нормализации.",
          tags: ["erd", "db"],
        },
      ],
    },
    {
      title: "Интеграции и API",
      description: "REST/GraphQL API, контроль версий, тестирование и безопасность.",
      tags: ["api", "rest", "graphql"],
      children: [
        {
          title: "REST",
          description: "Практики проектирования REST API, пагинация, idempotency-keys.",
          tags: ["rest"],
        },
        {
          title: "GraphQL",
          description: "Схемы, резолверы и подходы к авторизации.",
          tags: ["graphql"],
        },
      ],
    },
    {
      title: "Базы данных",
      description: "Проектирование, индексы, миграции и эксплуатация.",
      tags: ["db", "sql"],
      children: [
        {
          title: "SQL",
          description: "Запросы, индексы, оптимизация и планы выполнения.",
          tags: ["sql"],
        },
        {
          title: "Проектирование БД",
          description: "Схемы, ограничение целостности и подходы к миграциям.",
          tags: ["design", "db"],
        },
      ],
    },
  ];

  const topicIdByTitle = new Map();
  for (const topic of catalog) {
    const parentSlug = slugify(topic.title);
    const ins = await pool.query(
      `
      INSERT INTO topics (slug, title, description, tags)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
      [parentSlug, topic.title, topic.description, safeTags(topic.tags)]
    );
    const parentId = ins.rows[0].id;
    topicIdByTitle.set(topic.title, parentId);

    for (const child of topic.children || []) {
      const childSlug = slugify(`${topic.title}-${child.title}`);
      const childIns = await pool.query(
        `
        INSERT INTO topics (slug, title, description, tags, parent_topic_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
        [childSlug, child.title, child.description, safeTags(child.tags), parentId]
      );
      const childId = childIns.rows[0].id;
      topicIdByTitle.set(child.title, childId);

      for (const article of child.articles || []) {
        await pool.query(
          `
          INSERT INTO articles (topic_id, title, summary, content, tags)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [childId, article.title, article.summary, article.content, safeTags(article.tags)]
        );
      }
    }
  }

  const sampleQueue = [
    {
      title: "Онбординг аналитиков",
      description: "Чек-лист с артефактами, API и доступами",
      status: "draft",
    },
    {
      title: "Сбор требований к API",
      description: "Инструкция по шаблону REST-контракта",
      status: "processing",
    },
    {
      title: "Гайд по ERD для команды",
      description: "Пример диаграммы для раздела «Базы данных»",
      status: "finished",
      content:
        "<p>Включите сущности, связи, ключи и комментарии к колонкам. Покажите связь сервисов с источниками данных и главные ограничения.</p>",
      tags: ["erd", "db"],
    },
  ];

  for (const item of sampleQueue) {
    await pool.query(
      `
      INSERT INTO articles_queue (title, description, status, content, tags)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [item.title, item.description, item.status, item.content || null, safeTags(item.tags)]
    );
  }
}

export async function ensureAnalyticsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT[] DEFAULT '{}'::text[],
      parent_topic_id INT REFERENCES topics(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles_queue (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft','processing','finished','published'])),
      content TEXT,
      tags TEXT[] DEFAULT '{}'::text[],
      published_article_id INT,
      published_topic_id INT REFERENCES topics(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
      queue_id INT REFERENCES articles_queue(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      tags TEXT[] DEFAULT '{}'::text[],
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'articles_queue' AND constraint_name = 'articles_queue_published_article_id_fkey'
      ) THEN
        BEGIN
          ALTER TABLE articles_queue
          ADD CONSTRAINT articles_queue_published_article_id_fkey
          FOREIGN KEY (published_article_id) REFERENCES articles(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
          -- constraint was created concurrently
          NULL;
        END;
      END IF;
    END$$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_topic_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_articles_queue_status ON articles_queue(status);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'topics_set_updated_at') THEN
        CREATE TRIGGER topics_set_updated_at
        BEFORE UPDATE ON topics
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'articles_set_updated_at') THEN
        CREATE TRIGGER articles_set_updated_at
        BEFORE UPDATE ON articles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'articles_queue_set_updated_at') THEN
        CREATE TRIGGER articles_queue_set_updated_at
        BEFORE UPDATE ON articles_queue
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);

  await seedTopicsAndArticles();
}
