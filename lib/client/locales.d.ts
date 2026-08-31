/**
 * Locale dictionaries for the plugin's browser surfaces (settings card and
 * the skills section). Namespaced under the plugin id so entries cannot
 * collide with another plugin's strings.
 */
export declare const en: {
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
};
export declare const zh: {
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
};
//# sourceMappingURL=locales.d.ts.map