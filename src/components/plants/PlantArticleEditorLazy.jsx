import React, { Suspense } from "react";
import PageLoader from "../PageLoader.jsx";

const PlantArticleEditor = React.lazy(() => import("./PlantArticleEditor.jsx"));

export default function PlantArticleEditorLazy(props) {
  return (
    <Suspense fallback={<PageLoader message="Загружаем редактор статьи..." />}>
      <PlantArticleEditor {...props} />
    </Suspense>
  );
}

export async function loadPlantArticleExtensions() {
  const module = await import("./PlantArticleEditor.jsx");
  return module.getPlantArticleExtensions();
}
