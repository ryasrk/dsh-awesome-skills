/**
 * Locale dictionaries for the plugin's browser surfaces (settings card and
 * the skills section). Namespaced under the plugin id so entries cannot
 * collide with another plugin's strings.
 */
export declare const en: {
    readonly sectionTitle: "Skills";
    readonly searchPlaceholder: "Search the 16,000-skill corpus…";
    readonly searchHint: "Describe what you want to do; results come from semantic search on the host.";
    readonly results: "{n} results";
    readonly corpusCount: "{n} skills indexed";
    readonly copyPath: "Copy path";
    readonly copied: "Copied";
    readonly noResults: "No skills matched.";
    readonly error: "Search failed. Try again.";
    readonly loading: "Searching…";
    readonly cardTitle: "dsh-awesome-skills";
    readonly cardDescription: "Semantic search over the local 16,000-skill corpus";
    readonly fieldSemantic: "Semantic lane";
    readonly fieldSemanticHint: "Vector similarity (wasm). Off falls back to lexical + n-gram only";
    readonly fieldDefaultK: "Results per search";
    readonly fieldDefaultKHint: "How many hits search() returns (1-25)";
    readonly fieldPool: "Candidate pool";
    readonly fieldPoolHint: "Candidates re-ranked before the top results are chosen (50-3000)";
    readonly fieldWLex: "Lexical weight";
    readonly fieldWLexHint: "Weight of the keyword-overlap lane (0-1)";
    readonly fieldWGram: "N-gram weight";
    readonly fieldWGramHint: "Weight of the character-trigram lane (0-1)";
    readonly fieldAutoRoute: "Keep skill-router in step";
    readonly fieldAutoRouteHint: "Rewrite the installed skill-router when these values change";
    readonly detailSkillTitle: "Skill picked";
    readonly detailUnknownName: "name unavailable";
    readonly detailUnknownTool: "Unknown tool call";
    readonly detailTool: "Tool";
    readonly detailRunning: "Running…";
    readonly detailDuration: "Duration";
    readonly detailArgs: "Arguments";
    readonly detailOutput: "Output";
    readonly detailError: "Failed";
    readonly detailTruncated: "(truncated)";
    readonly unitMs: "ms";
    readonly unitS: "s";
    readonly unitMin: "min";
};
export declare const zh: {
    readonly sectionTitle: "技能";
    readonly searchPlaceholder: "搜索 1.6 万技能语料…";
    readonly searchHint: "描述你想做的事情；结果由宿主端的语义搜索返回。";
    readonly results: "{n} 条结果";
    readonly corpusCount: "已索引 {n} 个技能";
    readonly copyPath: "复制路径";
    readonly copied: "已复制";
    readonly noResults: "没有匹配的技能。";
    readonly error: "搜索失败，请重试。";
    readonly loading: "搜索中…";
    readonly cardTitle: "dsh-awesome-skills";
    readonly cardDescription: "对本地 1.6 万技能语料进行语义检索";
    readonly fieldSemantic: "语义通道";
    readonly fieldSemanticHint: "向量相似度（wasm）。关闭后仅用词法 + n-gram";
    readonly fieldDefaultK: "每次搜索结果数";
    readonly fieldDefaultKHint: "search() 返回的条数（1-25）";
    readonly fieldPool: "候选池大小";
    readonly fieldPoolHint: "重排前的候选数量（50-3000）";
    readonly fieldWLex: "词法权重";
    readonly fieldWLexHint: "关键词重合通道的权重（0-1）";
    readonly fieldWGram: "n-gram 权重";
    readonly fieldWGramHint: "字符三元组通道的权重（0-1）";
    readonly fieldAutoRoute: "同步 skill-router";
    readonly fieldAutoRouteHint: "这些值变化时重写已安装的 skill-router";
    readonly detailSkillTitle: "已选取技能";
    readonly detailUnknownName: "名称不可用";
    readonly detailUnknownTool: "未知工具调用";
    readonly detailTool: "工具";
    readonly detailRunning: "运行中…";
    readonly detailDuration: "耗时";
    readonly detailArgs: "参数";
    readonly detailOutput: "输出";
    readonly detailError: "失败";
    readonly detailTruncated: "（已截断）";
    readonly unitMs: "毫秒";
    readonly unitS: "秒";
    readonly unitMin: "分";
};
//# sourceMappingURL=locales.d.ts.map