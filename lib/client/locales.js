/**
 * Locale dictionaries for the plugin's browser surfaces (settings card and
 * the skills section). Namespaced under the plugin id so entries cannot
 * collide with another plugin's strings.
 */
export const en = {
    cardTitle: 'dsh-awesome-skills',
    cardDescription: 'Semantic search over the local 16,000-skill corpus',
    fieldSemantic: 'Semantic lane',
    fieldSemanticHint: 'Vector similarity (wasm). Off falls back to lexical + n-gram only',
    fieldDefaultK: 'Results per search',
    fieldDefaultKHint: 'How many hits search() returns (1-25)',
    fieldPool: 'Candidate pool',
    fieldPoolHint: 'Candidates re-ranked before the top results are chosen (50-3000)',
    fieldWLex: 'Lexical weight',
    fieldWLexHint: 'Weight of the keyword-overlap lane (0-1)',
    fieldWGram: 'N-gram weight',
    fieldWGramHint: 'Weight of the character-trigram lane (0-1)',
    fieldAutoRoute: 'Keep skill-router in step',
    fieldAutoRouteHint: 'Rewrite the installed skill-router when these values change',
};
export const zh = {
    cardTitle: 'dsh-awesome-skills',
    cardDescription: '对本地 1.6 万技能语料进行语义检索',
    fieldSemantic: '语义通道',
    fieldSemanticHint: '向量相似度（wasm）。关闭后仅用词法 + n-gram',
    fieldDefaultK: '每次搜索结果数',
    fieldDefaultKHint: 'search() 返回的条数（1-25）',
    fieldPool: '候选池大小',
    fieldPoolHint: '重排前的候选数量（50-3000）',
    fieldWLex: '词法权重',
    fieldWLexHint: '关键词重合通道的权重（0-1）',
    fieldWGram: 'n-gram 权重',
    fieldWGramHint: '字符三元组通道的权重（0-1）',
    fieldAutoRoute: '同步 skill-router',
    fieldAutoRouteHint: '这些值变化时重写已安装的 skill-router',
};
//# sourceMappingURL=locales.js.map