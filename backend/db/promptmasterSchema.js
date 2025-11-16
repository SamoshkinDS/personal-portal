import { pool } from "./connect.js";

const VALID_STATUSES = new Set(["draft", "sent", "processing", "done", "error"]);

async function upsertCategory({ title, description, parentId = null }) {
  const existing = await pool.query(
    `
    SELECT id
    FROM prompt_categories
    WHERE lower(title) = lower($1) AND
          (parent_category_id IS NOT DISTINCT FROM $2)
    LIMIT 1
  `,
    [title, parentId]
  );
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }
  const inserted = await pool.query(
    `
    INSERT INTO prompt_categories (title, description, parent_category_id)
    VALUES ($1, $2, $3)
    RETURNING id
  `,
    [title, description || null, parentId]
  );
  return inserted.rows[0].id;
}

async function seedPromptLibrary() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM prompt_categories");
  if ((rows?.[0]?.count || 0) > 0) return;

  const tree = [
    {
      title: "Написание текстов",
      description: "Быстрые заготовки для идей, SEO и улучшения текстов.",
      children: [
        { title: "Генерация идей", description: "Темы, варианты и углы подачи." },
        { title: "Улучшение текста", description: "Редактура, стили и тона." },
        { title: "SEO-промты", description: "Метатеги, структуры и семантика." },
      ],
    },
    {
      title: "Продуктовая работа",
      description: "Интервью, discovery и проверка гипотез.",
      children: [
        { title: "Интервью", description: "Вопросы и сценарии для глубинок." },
        { title: "Discovery", description: "Каркасы для анализа потребностей." },
      ],
    },
    {
      title: "IT & Аналитика",
      description: "Требования, диаграммы и техкарты.",
      children: [
        { title: "Шаблоны требований", description: "SRS, user stories и acceptance." },
        { title: "Диаграммы", description: "BPMN, sequence и ERD." },
      ],
    },
    {
      title: "Общие промты",
      description: "Креатив, навыки и решение задач.",
      children: [
        { title: "Креатив", description: "Идеи, формулировки и подходы." },
        { title: "Развитие навыков", description: "Планы и практики для роста." },
        { title: "Решение задач", description: "Структуры для разборов и решений." },
      ],
    },
  ];

  const articles = [
    {
      categoryPath: ["Написание текстов", "Генерация идей"],
      title: "10 идей для контента",
      description: "Сгенерировать набор тем под аудиторию и формат.",
      content:
        "Сформулируй 10 идей для публикаций на тему <тема>. Для каждой укажи заголовок, один ключевой поинт и подходящий формат (пост, статья, видео). Учитывай аудиторию: <описание аудитории>.",
    },
    {
      categoryPath: ["Продуктовая работа", "Интервью"],
      title: "Сценарий глубинки",
      description: "Структура вопросов для пользовательского интервью.",
      content:
        "Подготовь сценарий интервью для исследования <цель>. Начни с разогрева (3 вопроса), затем погрузись в текущий опыт пользователя, боли и обходные пути. Заверши проверкой реакции на предлагаемое решение. Для каждого блока перечисли по 4-6 конкретных вопросов.",
    },
    {
      categoryPath: ["IT & Аналитика", "Шаблоны требований"],
      title: "Каркас требования",
      description: "Опиши фичу структурой SRS/user story.",
      content:
        "На основе ввода <описание фичи> сформируй краткое SRS: цель, роли, user story, сценарий, предусловия, основной поток, альтернативы, критерии приемки, нефункциональные требования. Пиши по делу, без воды, маркерами.",
    },
    {
      categoryPath: ["Общие промты", "Креатив"],
      title: "Быстрый мозговой штурм",
      description: "Подбор неожиданных подходов и метафор.",
      content:
        "Предложи 7 неожиданных подходов, аналогий или метафор, чтобы объяснить или подать тему <тема>. Для каждого варианта добавь по одному предложению раскрытия.",
    },
  ];

  const categoryIdByPath = new Map();

  for (const group of tree) {
    const parentId = await upsertCategory({ title: group.title, description: group.description, parentId: null });
    categoryIdByPath.set(group.title, parentId);
    for (const child of group.children || []) {
      const childId = await upsertCategory({
        title: child.title,
        description: child.description,
        parentId,
      });
      categoryIdByPath.set(`${group.title}/${child.title}`, childId);
    }
  }

  for (const article of articles) {
    const pathKey = article.categoryPath.join("/");
    const categoryId = categoryIdByPath.get(pathKey) || null;
    await pool.query(
      `
      INSERT INTO prompt_articles (category_id, title, description, content)
      VALUES ($1, $2, $3, $4)
    `,
      [categoryId, article.title, article.description || null, article.content || null]
    );
  }
}

export async function ensurePromptmasterSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt_requests (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      result TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft','sent','processing','done','error'])),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt_categories (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      parent_category_id INT REFERENCES prompt_categories(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt_articles (
      id SERIAL PRIMARY KEY,
      category_id INT REFERENCES prompt_categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_prompt_requests_status ON prompt_requests(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_prompt_categories_parent ON prompt_categories(parent_category_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_prompt_articles_category ON prompt_articles(category_id);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prompt_requests_set_updated_at') THEN
        CREATE TRIGGER prompt_requests_set_updated_at
        BEFORE UPDATE ON prompt_requests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prompt_categories_set_updated_at') THEN
        CREATE TRIGGER prompt_categories_set_updated_at
        BEFORE UPDATE ON prompt_categories
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prompt_articles_set_updated_at') THEN
        CREATE TRIGGER prompt_articles_set_updated_at
        BEFORE UPDATE ON prompt_articles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prompt_settings_set_updated_at') THEN
        CREATE TRIGGER prompt_settings_set_updated_at
        BEFORE UPDATE ON prompt_settings
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);

  await seedPromptLibrary();
}

export { VALID_STATUSES };
